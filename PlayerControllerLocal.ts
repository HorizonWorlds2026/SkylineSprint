/**
 * Local Script that takes the Players input and allows for double jump and boost jumping.
 * Additionally, for responsiveness of game effects, it also plays SFX and VFX for players.
 */
import { Events } from "Events";
import * as hz from "horizon/core";
import * as MathUtils from "MathUtils";

export class PlayerControllerLocal extends hz.Component<
  typeof PlayerControllerLocal
> {
  // Define properties used in the script
  static propsDefinition = {
    doubleJumpSFX: { type: hz.PropTypes.Entity },
    boostUsedSFX: { type: hz.PropTypes.Entity },
    boostReceivedSFX: { type: hz.PropTypes.Entity },
    respawnSFX: { type: hz.PropTypes.Entity },
    boostUsedParticleVFX: { type: hz.PropTypes.Entity },
  };

  // Define the private class variables that are initialized later
  private doubleJumpSFX!: hz.AudioGizmo;
  private boostUsedSFX!: hz.AudioGizmo;
  private boostReceivedSFX!: hz.AudioGizmo;
  private respawnSFX!: hz.AudioGizmo;
  private localSFXSettings!: hz.AudioOptions; // Local-only sound settings for optimizing audio effects

  private boostUsedParticleVFX: hz.ParticleGizmo | null = null;

  private owner!: hz.Player; // Represents the player who owns this component
  private hasJumped: boolean = false; // Tracks if the player has jumped

  // Double Jump variables
  private jump1: boolean = false; // First jump flag
  private jump2: boolean = false; // Double jump flag

  // Boosted Jump variables
  private isBoosted: boolean = false; // Tracks if player has used boost
  private canBoost: boolean = false; // Tracks if player is able to boost
  private boostJumpAmount = 12; // Boost jump force
  private boostJumpRadians = 1.5; // Boost jump angle in radians
  private doubleJumpAmount = 5; // Double jump vertical force

  // Input connections for jump and boost
  private connectedJumpInput: hz.PlayerInput | null = null;
  private connectedBoostInput: hz.PlayerInput | null = null;
  private connectLocalControlX: hz.PlayerInput | null = null;
  private connectLocalControlY: hz.PlayerInput | null = null;

  // Event subscriptions
  private onUpdateSub: hz.EventSubscription | null = null;
  private setJumpCtrlDataSub: hz.EventSubscription | null = null;
  private onPlayerOOBSub: hz.EventSubscription | null = null;
  private stopRacePosUpdatesSub: hz.EventSubscription | null = null;
  private playerGotBoostSub: hz.EventSubscription | null = null;

  // Called before the component is started
  preStart() {
    this.owner = this.entity.owner.get(); // Set the owner (player) of the component
    if (this.owner !== this.world.getServerPlayer()) {
      this.localPreStart(); // Run client-specific pre-start setup if not on the server
    }
  }

  // Called when the component starts
  start() {
    if (this.owner === this.world.getServerPlayer()) {
      this.serverStart(); // Server-side setup if this component belongs to the server player
    } else {
      this.localStart(); // Client-side setup for local player
    }
  }

  // Server-side start logic
  private serverStart() {
    this.cleanup(); // Cleanup any pre-existing resources or event subscriptions
    this.sendLocalBroadcastEvent(Events.onRegisterPlyrCtrl, {
      caller: this.entity,
    }); // Notify others that the player controller is registered
  }

  // Pre-start logic for local client players
  private localPreStart() {
    this.connectDoubleJumpInputs(); // Set up input handlers for double jump
    this.connectBoostJumpInputs(); // Set up input handlers for boost
    // Initialize SFX and VFX entities
    this.doubleJumpSFX = this.props.doubleJumpSFX?.as(hz.AudioGizmo)!;
    this.boostUsedSFX = this.props.boostUsedSFX?.as(hz.AudioGizmo)!;
    this.boostReceivedSFX = this.props.boostReceivedSFX?.as(hz.AudioGizmo)!;
    this.respawnSFX = this.props.respawnSFX?.as(hz.AudioGizmo)!;
    this.localSFXSettings = { fade: 0, players: [this.owner] }; // Optimization to create local-only sound settings

    this.boostUsedParticleVFX = this.props.boostUsedParticleVFX?.as(hz.ParticleGizmo)!;

    // Update subscription to reset abilities when grounded
    this.onUpdateSub = this.connectLocalBroadcastEvent(
      hz.World.onUpdate,
      () => {
        // Reset ability to double jump or boost when player is grounded
        if (this.hasJumped && this.owner.isGrounded.get()) {
          this.hasJumped = false;
          this.jump1 = false;
          this.jump2 = false;
          this.isBoosted = false;
        }
      }
    );

    // Listen for boost received event
    this.playerGotBoostSub = this.connectNetworkEvent(
      this.owner,
      Events.onPlayerGotBoost,
      () => {
        this.canBoost = true; // Allow player to boost
        this.boostReceivedSFX?.play(this.localSFXSettings!); // Play boost received sound
      }
    );

    // Listen for updates to jump control data
    this.setJumpCtrlDataSub = this.connectNetworkEvent(
      this.owner,
      Events.onSetPlyrCtrlData,
      (data) => {
        this.boostJumpAmount = data.boostJumpAmount;
        this.boostJumpRadians = data.boostJumpAngle * MathUtils.Deg2Rad;
        this.doubleJumpAmount = data.doubleJumpAmount;
      }
    );

    // Play respawn sound when player is out of bounds
    this.onPlayerOOBSub = this.connectNetworkEvent(
      this.owner,
      Events.onPlayerOutOfBounds,
      () => {
        this.respawnSFX?.play(this.localSFXSettings!);
      }
    );

    // Reset player states when local objects are reset
    this.connectLocalEvent(
      this.owner,
      Events.onResetLocalObjects,
      () => {
        this.reset();
      }
    );
  }

  // Client-side start logic for local player
  private localStart() {
    this.sendNetworkBroadcastEvent(Events.onGetPlyrCtrlData, {
      caller: this.owner,
    }); // Request current jump control data from the server
  }

  // Set up double jump input connection
  private connectDoubleJumpInputs() {
    this.connectedJumpInput = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.Jump,
      hz.ButtonIcon.Jump,
      this
    );
    // Register callback for jump input
    this.connectedJumpInput.registerCallback((input, pressed) => {
      if (!pressed) {
        return;
      }
      this.hasJumped = true;

      if (!this.jump1 && !this.jump2) {
        this.jump1 = true; // Set first jump flag
      } else if (this.jump1 && !this.jump2) {
        this.jump2 = true; // Set double jump flag
        let ownerVel = this.owner.velocity.get();
        // Apply upward velocity for double jump
        this.owner.velocity.set(
          new hz.Vec3(ownerVel.x, this.doubleJumpAmount, ownerVel.z)
        );

        this.doubleJumpSFX?.play(this.localSFXSettings!); // Play double jump sound
        this.sendNetworkEvent(this.owner, Events.onPlayerUsedDoubleJump, {}); // Notify network of double jump
      }
    });
  }

  // Set up boost jump input connection
  private connectBoostJumpInputs() {
    this.connectedBoostInput = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.RightSecondary,
      hz.ButtonIcon.RocketJump,
      this,
      { preferredButtonPlacement: hz.ButtonPlacement.Default }
    );
    // Connect control inputs for player movement
    this.connectLocalControlX = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.LeftXAxis,
      hz.ButtonIcon.RocketJump,
      this,
    );
    this.connectLocalControlY = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.LeftYAxis,
      hz.ButtonIcon.RocketJump,
      this,
    );

    // Register callback for boost input
    this.connectedBoostInput.registerCallback((input, pressed) => {
      if (!pressed) {
        return;
      }
      this.hasJumped = true;

      if (!this.isBoosted && this.canBoost) {
        this.canBoost = false; // Consume boost ability
        let XAxis = this.connectLocalControlX?.axisValue.get();
        let YAxis = this.connectLocalControlY?.axisValue.get();

        // If there is no player movement, default to boosting forward
        if (
          XAxis === undefined ||
          YAxis === undefined ||
          (XAxis === 0 && YAxis === 0)
        ) {
          XAxis = 0;
          YAxis = 1;
        }

        // Get the boost vector based on player's input
        const boostJump = this.getBoostVectorBasedOnInput(
          XAxis,
          YAxis,
          this.owner.forward.get(),
          this.boostJumpRadians,
          this.boostJumpAmount
        );

        // Set the player's velocity to the boost jump vector for a responsive effect
        this.owner.velocity.set(boostJump);
        this.isBoosted = true;

        this.boostUsedSFX?.play(this.localSFXSettings!); // Play boost used sound
        this.entity.position.set(this.owner.position.get()); // Sync entity position with player
        this.boostUsedParticleVFX?.play(); // Play boost particle effect
        this.sendLocalEvent(this.owner, Events.onPlayerUsedBoost, {}); // Notify boost usage
      }
    });
  }

  // Calculates the boost vector based on player input and facing direction
  private getBoostVectorBasedOnInput(
    XaxisInput: number,
    YaxisInput: number,
    ownerfacing: hz.Vec3,
    boostAngle: number,
    boostForce: number
  ) {
    const facingXZ = new hz.Vec3(ownerfacing.x, 0, ownerfacing.z).normalizeInPlace();

    // Rotate the input direction based on the player's facing direction
    const angleRads = MathUtils.getClockwiseAngle(hz.Vec3.forward, facingXZ);
    const quartForControl = hz.Quaternion.fromAxisAngle(hz.Vec3.up, angleRads).normalizeInPlace();

    const movementDir = new hz.Vec3(
      XaxisInput,
      0,
      YaxisInput
    ).normalizeInPlace();
    // Get the final direction for the boost vector
    const boostFlatDir = hz.Quaternion.mulVec3(quartForControl, movementDir);

    // Rotate the boost direction by the provided angle
    const rotation = hz.Quaternion.fromAxisAngle(
      boostFlatDir.cross(hz.Vec3.up),
      boostAngle
    );
    const boostJump = hz.Quaternion.mulVec3(rotation, boostFlatDir).mulInPlace(boostForce);
    return boostJump;
  }

  // Resets the jump and boost states
  private reset() {
    this.hasJumped = false;
    this.jump1 = false;
    this.jump2 = false;
    this.isBoosted = false;
    this.canBoost = false;
  }

  // Cleans up input connections and event subscriptions
  private cleanup() {
    this.connectedJumpInput?.unregisterCallback();
    this.connectedJumpInput?.disconnect();
    this.connectedJumpInput = null;

    this.connectedBoostInput?.unregisterCallback();
    this.connectedBoostInput?.disconnect();
    this.connectedBoostInput = null;

    this.connectLocalControlX?.unregisterCallback();
    this.connectLocalControlX?.disconnect();
    this.connectLocalControlX = null;

    this.connectLocalControlY?.unregisterCallback();
    this.connectLocalControlY?.disconnect();
    this.connectLocalControlY = null;

    this.onUpdateSub?.disconnect();
    this.onUpdateSub = null;

    this.playerGotBoostSub?.disconnect();
    this.playerGotBoostSub = null;

    this.setJumpCtrlDataSub?.disconnect();
    this.setJumpCtrlDataSub = null;

    this.onPlayerOOBSub?.disconnect();
    this.onPlayerOOBSub = null;

    this.stopRacePosUpdatesSub?.disconnect();
    this.stopRacePosUpdatesSub = null;
  }
}

// Register the component with the framework
hz.Component.register(PlayerControllerLocal);
