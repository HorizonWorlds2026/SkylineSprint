import * as hz from 'horizon/core';
import { Events } from "Events";
import { PlayerFireEventOnTriggerBase } from 'PlayerEventTriggerBase';

/**
 * PlayerOOBTrigger Component
 * This component extends the PlayerFireEventOnTriggerBase class and handles Out-Of-Bounds (OOB) events for players.
 * When a player enters the OOB trigger area, this component informs the player's local controller to respawn them.
 */
class PlayerOOBTrigger extends PlayerFireEventOnTriggerBase<typeof PlayerOOBTrigger> {
  /**
   * Override method: Handle entity entering the trigger area
   * Currently not used for any functionality.
   * @param {hz.Entity} _enteredBy - The entity that entered the trigger area.
   */
  protected onEntityEnterTrigger(_enteredBy: hz.Entity): void { }

  /**
   * Override method: Handle entity exiting the trigger area
   * Currently not used for any functionality.
   * @param {hz.Entity} _exitedBy - The entity that exited the trigger area.
   */
  protected onEntityExitTrigger(_exitedBy: hz.Entity): void { }

  /**
   * Override method: Handle player exiting the trigger area
   * Currently not used for any functionality.
   * @param {hz.Player} _exitedBy - The player that exited the trigger area.
   */
  protected onPlayerExitTrigger(_exitedBy: hz.Player): void { }

  /**
   * Override method: Handle player entering the trigger area
   * When a player enters the OOB trigger, a network event is sent to inform the player's local controller that they are out of bounds.
   * This triggers the player's respawn process.
   * @param {hz.Player} enteredBy - The player who entered the trigger area.
   */
  protected onPlayerEnterTrigger(enteredBy: hz.Player): void {
    this.sendNetworkEvent(enteredBy, Events.onPlayerOutOfBounds, {});
  }
}

// Register the PlayerOOBTrigger component with the framework
hz.Component.register(PlayerOOBTrigger);
