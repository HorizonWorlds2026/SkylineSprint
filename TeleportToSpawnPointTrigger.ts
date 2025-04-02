/**
 * Extended class that teleports the entering player to a specific spawn point.
 * 
 * This class is triggered when a player enters a specific zone. Upon entering, 
 * the player is teleported to a designated spawn point.
 */

import * as hz from 'horizon/core';
import { PlayerFireEventOnTriggerBase } from 'PlayerEventTriggerBase';

// Define a new component that extends PlayerFireEventOnTriggerBase.
class TeleportToSpawnPointTrigger extends PlayerFireEventOnTriggerBase<typeof TeleportToSpawnPointTrigger> {

  // Define the properties available for this component, specifically the spawn point entity.
  static propsDefinition = {
    spawnPoint: { type: hz.PropTypes.Entity } // Entity property representing the spawn point to teleport to
  };

  // Event handlers for when an entity (non-player) enters or exits the trigger zone.
  // These methods are not used in this class, hence they are left empty.
  protected onEntityEnterTrigger(_enteredBy: hz.Entity): void { }
  protected onEntityExitTrigger(_exitedBy: hz.Entity): void { }

  // Event handler for when a player leaves the trigger zone.
  // Not used in this class, so it is left empty.
  protected onPlayerExitTrigger(_exitedBy: hz.Player): void { }

  /**
   * Handles the event when a player enters the trigger zone.
   * Teleports the player to the designated spawn point.
   * 
   * @param enteredBy - The player that entered the trigger.
   */
  protected onPlayerEnterTrigger(enteredBy: hz.Player): void {
    // Log a warning to indicate which player is being teleported and to which spawn point.
    console.warn(`teleported ${enteredBy.name.get()} to ${this.props.spawnPoint!.name.get()}`);

    // Teleport the player to the spawn point defined in the component's properties.
    this.props.spawnPoint!.as(hz.SpawnPointGizmo)!.teleportPlayer(enteredBy);
  }
}

// Register the component with the Horizon framework so it can be used in the application.
hz.Component.register(TeleportToSpawnPointTrigger);
