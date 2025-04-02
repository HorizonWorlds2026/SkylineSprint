import * as hz from "horizon/core";
import { Events } from "Events";
import { msToMinutesAndSeconds } from "GameUtils";

/**
 * HUDLocal Component
 * This component manages the local player's HUD, which displays their race position and match timing.
 * It listens to various game events to update the UI and handle boost activation effects.
 */
class HUDLocal extends hz.Component<typeof HUDLocal> {
  // Define properties available in the property panel of the component
  static propsDefinition = {
    superIcon: { type: hz.PropTypes.Entity }, // Entity representing the main HUD icon
    timerText: { type: hz.PropTypes.Entity }, // Entity for displaying the race timer text
    positionText: { type: hz.PropTypes.Entity }, // Entity for displaying the player's race position
    iconColorEntity: { type: hz.PropTypes.Entity }, // Entity for the boost icon color
    vfx: { type: hz.PropTypes.Entity }, // Visual effects for when boost is used
  };

  // Internal properties for managing player state and UI
  private owner!: hz.Player;
  private localMatchTime = 0;
  private updateUI = false;

  // Event subscriptions for various game actions
  private playerBoostSub: hz.EventSubscription | null = null;
  private stopRacePosUpdatesSub: hz.EventSubscription | null = null;
  private racePosUpdateSub: hz.EventSubscription | null = null;
  private playerUsedBoostSub: hz.EventSubscription | null = null;
  private worldUpdateSub: hz.EventSubscription | null = null;

  private racePosition: string = "";
  private matchTime: string = "";

  // Colors for boost icon status
  private boostInactiveColor = new hz.Color(1, 0, 0); // Red color when boost is inactive
  private boostActiveColor = new hz.Color(0, 1, 0); // Green color when boost is active

  // References to UI entities
  private iconGroup: hz.Entity | null = null;
  private innerIcon: hz.Entity | null = null;
  private timerTextGizmo: hz.TextGizmo | null = null;
  private positionTextGizmo: hz.TextGizmo | null = null;

  // Properties for managing the boost spin effect
  private shouldSpinStar: boolean = false;
  private spinCounter: number = 0;
  private spinDuration: number = 2;
  private spinSpeed: number = 5;
  private fromRotation: hz.Quaternion = hz.Quaternion.fromEuler(new hz.Vec3(180, 0, 90), hz.EulerOrder.XYZ);
  private toRotation: hz.Quaternion = hz.Quaternion.fromEuler(new hz.Vec3(0, 0, 90), hz.EulerOrder.XYZ);

  // Pre-start lifecycle method to initialize component properties
  preStart() {
    // Initialize UI entities if not already assigned
    if (!this.innerIcon) {
      this.innerIcon = this.props.iconColorEntity!;
    }
    if (!this.iconGroup) {
      this.iconGroup = this.props.superIcon!;
      this.iconGroup?.transform.localRotation.set(this.fromRotation);
    }
    if (!this.timerTextGizmo) {
      this.timerTextGizmo = this.props.timerText!.as(hz.TextGizmo);
    }
    if (!this.positionTextGizmo) {
      this.positionTextGizmo = this.props.positionText!.as(hz.TextGizmo);
    }

    // Set the owner to the entity's owner and adjust visibility accordingly
    this.owner = this.entity.owner.get();
    if (this.owner === this.world.getServerPlayer()) {
      // If this is the server player, clean up and make the HUD invisible
      this.cleanup();
      this.entity.as(hz.AttachableEntity)?.detach();
      this.entity.visible.set(false);
    } else {
      // If this is a local player, set up UI and event handling
      this.setInactiveBoostColor();

      // Subscribe to boost activation event
      this.playerBoostSub = this.connectNetworkEvent(
        this.owner,
        Events.onPlayerGotBoost,
        () => {
          this.activateBoostAbility();
        }
      );

      // Subscribe to event for stopping race position updates
      this.stopRacePosUpdatesSub = this.connectNetworkEvent(
        this.owner,
        Events.onStopRacePosUpdates,
        () => {
          this.updateUI = false;
        }
      );

      // Subscribe to race position updates
      this.racePosUpdateSub = this.connectNetworkEvent(
        this.owner,
        Events.onRacePosUpdate,
        (data) => {
          this.updateUI = true;
          this.racePosition = `${data.playerPos} of ${data.totalRacers}`;
          this.localMatchTime = data.matchTime; // Update local match time to match the server's time
        }
      );

      // Subscribe to event for when the player uses boost
      this.playerUsedBoostSub = this.connectLocalEvent(
        this.owner,
        Events.onPlayerUsedBoost,
        () => {
          this.props.vfx?.as(hz.ParticleGizmo)?.play(); // Play visual effect
          this.setInactiveBoostColor();
        }
      );

      // Subscribe to world update events to manage UI updates and animations
      this.worldUpdateSub = this.connectLocalBroadcastEvent(
        hz.World.onUpdate,
        (data) => {
          if (!this.updateUI) {
            return;
          }

          // Update timer text and position text with the latest information
          this.localMatchTime += data.deltaTime;
          this.timerTextGizmo?.text.set(`<line-height=75%>${msToMinutesAndSeconds(this.localMatchTime)}`);
          this.positionTextGizmo?.text.set(`<line-height=75%>${this.racePosition}`);

          // Handle the star spinning effect in the HUD
          if (this.shouldSpinStar === true) {
            const current = this.iconGroup?.transform.localRotation.get();
            if (current != undefined) {
              if (this.spinCounter < this.spinDuration) {
                this.iconGroup?.transform.localRotation.set(hz.Quaternion.slerp(current, this.toRotation, this.spinCounter));
                this.spinCounter += data.deltaTime * this.spinSpeed;
              }
            }
            if (this.spinCounter >= this.spinDuration) {
              this.shouldSpinStar = false;
              this.iconGroup?.transform.localRotation.set(this.fromRotation);
            }
          }
        }
      );

      // Reset local objects when necessary
      this.connectLocalEvent(
        this.owner,
        Events.onResetLocalObjects,
        () => {
          this.reset();
        }
      );

      // Attach the HUD to the player's head anchor
      let attachableEnt = this.entity.as(hz.AttachableEntity);
      attachableEnt?.detach();
      attachableEnt?.visible.set(true);
      attachableEnt?.setVisibilityForPlayers([this.owner], hz.PlayerVisibilityMode.VisibleTo);
      attachableEnt?.attachToPlayer(this.owner, hz.AttachablePlayerAnchor.Head);
    }
  }

  // Called when the component starts
  start() {
    if (this.owner === this.world.getServerPlayer()) {
      this.sendLocalBroadcastEvent(Events.onRegisterRaceHUD, {
        caller: this.entity,
      });
    }
  }

  // Set the boost icon color to active (green)
  private setActiveBoostColor(): void {
    const star = this.innerIcon?.as(hz.MeshEntity)!;
    star.style.tintColor.set(this.boostActiveColor);
    star.style.tintStrength.set(1);
    star.style.brightness.set(5);
  }

  // Set the boost icon color to inactive (red)
  private setInactiveBoostColor(): void {
    const star = this.innerIcon?.as(hz.MeshEntity)!;
    star.style.tintColor.set(this.boostInactiveColor);
    star.style.tintStrength.set(1);
    star.style.brightness.set(5);
  }

  // Activate the boost ability, changing the color and initiating the spin effect
  private activateBoostAbility(): void {
    this.setActiveBoostColor();
    this.spinCounter = 0;
    this.iconGroup?.transform.localRotation.set(this.fromRotation);
    this.shouldSpinStar = true;
  }

  // Clean up event subscriptions and reset UI elements
  private cleanup(): void {
    this.playerBoostSub?.disconnect();
    this.stopRacePosUpdatesSub?.disconnect();
    this.racePosUpdateSub?.disconnect();
    this.playerUsedBoostSub?.disconnect();
    this.worldUpdateSub?.disconnect();

    this.playerBoostSub = null;
    this.stopRacePosUpdatesSub = null;
    this.racePosUpdateSub = null;
    this.playerUsedBoostSub = null;
    this.worldUpdateSub = null;
    this.reset();
  }

  // Reset the HUD to its default state
  private reset(): void {
    this.setInactiveBoostColor();
    this.racePosition = "";
    this.matchTime = "";
    this.timerTextGizmo?.text.set(`<line-height=75%>${this.matchTime}`);
    this.positionTextGizmo?.text.set(`<line-height=75%>${this.racePosition}`);
    this.entity.position.set(hz.Vec3.zero);
  }
}

// Register the HUDLocal component with the framework
hz.Component.register(HUDLocal);
