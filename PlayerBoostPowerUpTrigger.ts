import * as hz from 'horizon/core';
import { Events } from "Events";
import { PlayerFireEventOnTriggerBase } from 'PlayerEventTriggerBase';

/**
 * PlayerBoostPowerUpTrigger Component
 * This component extends the PlayerFireEventOnTriggerBase class to provide functionality for a boost power-up.
 * When a player enters the trigger area, an event is sent to their local controller to allow boosting.
 */
class PlayerBoostPowerUpTrigger extends PlayerFireEventOnTriggerBase<typeof PlayerBoostPowerUpTrigger> {
  // Override method: Handle entity entering the trigger
  protected onEntityEnterTrigger(_enteredBy: hz.Entity): void { }

  // Override method: Handle entity exiting the trigger
  protected onEntityExitTrigger(_exitedBy: hz.Entity): void { }

  // Override method: Handle player exiting the trigger
  protected onPlayerExitTrigger(_exitedBy: hz.Player): void { }

  /**
   * Override method: Handle player entering the trigger
   * When a player enters the trigger area, send an event to notify that the player received a boost.
   * @param {hz.Player} enteredBy - The player who entered the trigger area.
   */
  protected onPlayerEnterTrigger(enteredBy: hz.Player): void {
    this.sendNetworkEvent(enteredBy, Events.onPlayerGotBoost, {});
  }
}

// Register the PlayerBoostPowerUpTrigger component with the framework
hz.Component.register(PlayerBoostPowerUpTrigger);
