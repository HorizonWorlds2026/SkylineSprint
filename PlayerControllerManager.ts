import * as hz from 'horizon/core';
import { Pool } from 'GameUtils';
import { Events } from "Events";

/**
 * PlayerControllerManager Component
 * This component manages the initialization of local player control inputs and manages ownership changes.
 * It is responsible for assigning control inputs to players as they enter or leave the game world.
 */

export interface PlayerControllerManagerProps {
  doubleJumpAmount: number, // Amount of force applied during a double jump
  boostJumpAmount: number, // Amount of force applied during a boost jump
  boostJumpAngle: number // Angle of the boost jump in degrees
}

export class PlayerControllerManager extends hz.Component<typeof PlayerControllerManager> {
  // Define properties available in the component property panel
  static propsDefinition = {
    doubleJumpAmount: { type: hz.PropTypes.Number, default: 5 }, // Default double jump amount
    boostJumpAmount: { type: hz.PropTypes.Number, default: 12 }, // Default boost jump amount
    boostJumpAngle: { type: hz.PropTypes.Number, default: 90 } // Default boost jump angle
  };

  // Pool to manage available control entities
  private ctrlPool: Pool<hz.Entity> = new Pool<hz.Entity>();
  // Map to associate players with their respective control entities
  private playerCtrlMap: Map<number, hz.Entity> = new Map<number, hz.Entity>();

  // Singleton instance of PlayerControllerManager
  private static s_instance: PlayerControllerManager;
  public static getInstance(): PlayerControllerManager {
    return PlayerControllerManager.s_instance;
  }

  constructor() {
    super();
    if (PlayerControllerManager.s_instance === undefined) {
      PlayerControllerManager.s_instance = this;
    } else {
      console.error(`There are two ${this.constructor.name} in the world!`);
      return;
    }
  }

  // Pre-start lifecycle method to initialize event listeners
  preStart() {
    // Handle player entering the world
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
      this.handleOnPlayerEnterWorld(player);
    });

    // Handle player exiting the world
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, (player: hz.Player) => {
      this.handleOnPlayerExitWorld(player);
    });

    // Handle registration of player controls and add them to the control pool
    this.connectLocalBroadcastEvent(Events.onRegisterPlyrCtrl, (data) => {
      this.ctrlPool.addToPool(data.caller);
    });

    // Handle requests for player control data and send control configuration to the player
    this.connectNetworkBroadcastEvent(
      Events.onGetPlyrCtrlData, (data) => {
        this.sendNetworkEvent(
          data.caller,
          Events.onSetPlyrCtrlData,
          {
            doubleJumpAmount: this.props.doubleJumpAmount,
            boostJumpAmount: this.props.boostJumpAmount,
            boostJumpAngle: this.props.boostJumpAngle,
          });
      }
    );
  }

  // Empty start method that can be overridden if needed
  start() { };

  // Handle player exiting the world and release their control entity
  private handleOnPlayerExitWorld(player: hz.Player): void {
    const playerCtrl = this.playerCtrlMap.get(player.id);
    if (playerCtrl) {
      console.log(`${this.constructor.name} Removed Local Controller from ${player.name.get()}`);
      
      // Set the control entity's owner to the server player and add it back to the control pool
      playerCtrl.owner.set(this.world.getServerPlayer());
      this.ctrlPool.addToPool(playerCtrl);
    }
    // Remove the player's control entity from the map
    this.playerCtrlMap.delete(player.id);
  };

  // Handle player entering the world and assign an available control entity to them
  private handleOnPlayerEnterWorld(player: hz.Player): void {
    const availableCtrl = this.ctrlPool.getNextAvailable();
    if (availableCtrl) {
      console.log(`${this.constructor.name} Attached Local Controller to ${player.name.get()}`);
      
      // Set the control entity's owner to the player and map it
      availableCtrl.owner.set(player);
      this.playerCtrlMap.set(player.id, availableCtrl);
    }
  };
}

// Register the PlayerControllerManager component with the framework
hz.Component.register(PlayerControllerManager);