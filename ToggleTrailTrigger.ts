/**
 * Extended class that specifically toggles the CurveVisualizer class inside GameUtils.ts.
 * 
 * This class is designed to handle player interactions with a trigger zone, toggling the visibility
 * or activation of a curve visualizer when a player enters the zone. This can be used for displaying
 * or hiding race paths, trails, or other game visual effects tied to curves.
 */

import * as hz from 'horizon/core';
import { CurveVisualizer } from 'GameUtils';  // Importing CurveVisualizer to toggle its visual state.
import { PlayerFireEventOnTriggerBase } from 'PlayerEventTriggerBase';

// Define a new component class that extends PlayerFireEventOnTriggerBase.
// This component will toggle the state of the CurveVisualizer whenever a player enters the trigger zone.
class ToggleTrailTrigger extends PlayerFireEventOnTriggerBase<typeof ToggleTrailTrigger> {

  // These event handlers are placeholders for when an entity (not a player) enters or exits the trigger zone.
  // In this class, these handlers are not used, so they are left empty.
  protected onEntityEnterTrigger(_enteredBy: hz.Entity): void { }
  protected onEntityExitTrigger(_exitedBy: hz.Entity): void { }

  // Event handler for when a player exits the trigger zone.
  // Not needed in this class, so it is left empty.
  protected onPlayerExitTrigger(_exitedBy: hz.Player): void { }

  // Boolean to keep track of whether the CurveVisualizer is currently on or off.
  private toggle = false;

  /**
   * Handles the event when a player enters the trigger zone.
   * Toggles the CurveVisualizer on or off.
   * 
   * @param _enteredBy - The player who entered the trigger zone.
   */
  protected onPlayerEnterTrigger(_enteredBy: hz.Player): void {
    // Toggle the boolean state: If it was false, make it true; if it was true, make it false.
    this.toggle = !this.toggle;

    // Based on the toggle state, either start or stop drawing the curve.
    if (this.toggle) {
      // If toggled on, broadcast an event to stop drawing the curve.
      this.sendLocalBroadcastEvent(CurveVisualizer.StopDrawingCurve, {});
    } else {
      // If toggled off, broadcast an event to start drawing the curve.
      this.sendLocalBroadcastEvent(CurveVisualizer.StartDrawingCurve, {});
    }
  }

}

// Register the component with the Horizon framework so it can be used in the game.
hz.Component.register(ToggleTrailTrigger);
