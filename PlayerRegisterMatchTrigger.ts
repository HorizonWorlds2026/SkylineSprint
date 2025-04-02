import * as hz from 'horizon/core';
import { Events } from "Events";
import { PlayerFireEventOnTriggerBase } from 'PlayerEventTriggerBase';

/**
 * PlayerRegisterMatchTrigger Component
 * This component extends the PlayerFireEventOnTriggerBase class and manages the registration and deregistration of players for a match.
 * It listens for player movement into and out of a designated trigger area to add or remove players from a match queue.
 */
class PlayerRegisterMatchTrigger extends PlayerFireEventOnTriggerBase<typeof PlayerRegisterMatchTrigger> {
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
   * This method deregisters the player from the match standby queue when they exit the trigger area.
   * However, to encourage more race starts and reduce the potential for trolling, this does not remove them from standby entirely.
   * @param {hz.Player} exitedBy - The player that exited the trigger area.
   */
  protected onPlayerExitTrigger(exitedBy: hz.Player): void {
    this.sendLocalBroadcastEvent(Events.onDeregisterPlayerForMatch, { player: exitedBy });
  }

  /**
   * Override method: Handle player entering the trigger area
   * This method registers the player for the match when they enter the trigger area, adding them to the standby queue.
   * @param {hz.Player} enteredBy - The player that entered the trigger area.
   */
  protected onPlayerEnterTrigger(enteredBy: hz.Player): void {
    this.sendLocalBroadcastEvent(Events.onRegisterPlayerForMatch, { player: enteredBy });
  }
}

// Register the PlayerRegisterMatchTrigger component with the framework
hz.Component.register(PlayerRegisterMatchTrigger);