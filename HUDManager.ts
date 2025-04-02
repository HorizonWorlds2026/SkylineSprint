import * as hz from "horizon/core";
import { Pool } from "GameUtils";
import { Events } from "Events";

/**
 * HUDManager Component
 * This component is responsible for managing the player local HUDs.
 * It initializes HUDs for players and passes information about the race state to each player's HUD.
 * It maintains a pool of available HUDs and assigns or releases HUDs when players enter or exit the game world.
 */
export class HUDManager extends hz.Component {
  static propsDefinition = {};

  // Pool to manage available HUD entities
  private HUDPool: Pool<hz.Entity> = new Pool<hz.Entity>();
  // Map to associate players with their respective HUD entities
  private playerHUDCtrlMap: Map<number, hz.Entity> = new Map<number, hz.Entity>();

  // Singleton instance of HUDManager
  private static s_instance: HUDManager;
  public static getInstance(): HUDManager {
    return HUDManager.s_instance;
  }

  constructor() {
    super();
    if (HUDManager.s_instance === undefined) {
      HUDManager.s_instance = this;
    } else {
      console.error(`There are two ${this.constructor.name} in the world!`);
      return;
    }
  }

  // Pre-start lifecycle method to initialize HUD pool and handle player events
  preStart() {
    // Event: Register available HUD entities when they are created
    this.connectLocalBroadcastEvent(
      Events.onRegisterRaceHUD,
      (data) => {
        this.HUDPool.addToPool(data.caller);
      }
    );

    // Event: Handle player entering the world and assign a HUD to them
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player: hz.Player) => {
        this.handleOnPlayerEnterWorld(player);
      }
    );

    // Event: Handle player exiting the world and release their HUD
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      (player: hz.Player) => {
        this.handleOnPlayerExitWorld(player);
      }
    );
  }

  // Empty start method that can be overridden if needed
  start() {}

  // Handle player exiting the world
  private handleOnPlayerExitWorld(player: hz.Player): void {
    const playerHC = this.playerHUDCtrlMap.get(player.id);
    if (playerHC) {
      // Set the HUD's owner to the server player and add it back to the pool
      playerHC.owner.set(this.world.getServerPlayer());
      this.HUDPool.addToPool(playerHC);
    }
    // Remove the player's HUD from the map
    this.playerHUDCtrlMap.delete(player.id);
  }

  // Handle player entering the world
  private handleOnPlayerEnterWorld(player: hz.Player): void {
    const availableHC = this.HUDPool.getNextAvailable();
    if (availableHC) {
      console.log(`${this.constructor.name} Attached HUD Local to ${player.name.get()}`);
      // Set the HUD's owner to the player and map it
      availableHC.owner.set(player);
      this.playerHUDCtrlMap.set(player.id, availableHC);
    }
  }
}

// Register the HUDManager component with the framework
hz.Component.register(HUDManager);
