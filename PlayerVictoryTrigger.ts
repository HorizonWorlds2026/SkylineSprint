import * as hz from 'horizon/core';
import { Events } from "Events";
import { PlayerFireEventOnTriggerBase } from 'PlayerEventTriggerBase';

/**
 * PlayerVictoryTrigger Component
 * This component handles the event when a player reaches the victory area.
 * It triggers the player's victory celebration effects and broadcasts that the player has reached the goal.
 */
class PlayerVictoryTrigger extends PlayerFireEventOnTriggerBase<typeof PlayerVictoryTrigger> {

  // Define properties available for configuration in the component property panel
  static propsDefinition = {
    particle1: { type: hz.PropTypes.Entity }, // Reference to the first particle effect entity
    particle2: { type: hz.PropTypes.Entity }, // Reference to the second particle effect entity
  };

  /**
   * Override method: Handle entity entering the trigger area
   * Currently not used for any functionality.
   */
  protected onEntityEnterTrigger(): void {}

  /**
   * Override method: Handle entity exiting the trigger area
   * Currently not used for any functionality.
   */
  protected onEntityExitTrigger(): void {}

  /**
   * Override method: Handle player exiting the trigger area
   * Currently not used for any functionality.
   */
  protected onPlayerExitTrigger(): void {}

  /**
   * Override method: Handle player entering the trigger area
   * This method is called when a player enters the victory trigger area. It performs the following actions:
   * - Logs a message indicating that the player has entered the trigger.
   * - Sends an event to broadcast that the player has reached the goal, including their match time.
   * - Plays the victory particle effects for visual feedback.
   * 
   * @param {hz.Player} enteredBy - The player who entered the trigger area.
   */
  protected onPlayerEnterTrigger(enteredBy: hz.Player): void {
    console.log(`Player entered victory trigger: ${enteredBy.name.get()}`);
    
    // Assuming the player's match time is already calculated somewhere in the game manager logic
    // Here we are triggering the event that should carry this player's finish time
    
    // Retrieve the player's match time using the placeholder function
    const matchTime = this.getMatchTimeForPlayer(enteredBy);
    if (matchTime !== undefined) {
      // Send a local broadcast event to indicate that the player has reached the goal
      this.sendLocalBroadcastEvent(Events.onPlayerReachedGoal, { player: enteredBy, matchTime });
    }

    // Play victory particles to celebrate the player's success
    [this.props.particle1, this.props.particle2].forEach(particle => {
      particle?.as(hz.ParticleGizmo)?.play();
    });
  }

  /**
   * Placeholder function: Get the player's match time
   * This function simulates retrieving the player's finish time. In practice, this should be replaced with actual logic
   * that gets the match time from a game manager or relevant game state that tracks player progress.
   * 
   * @param {hz.Player} player - The player for whom the match time is being retrieved.
   * @returns {number | undefined} - The match time of the player in seconds, or undefined if not available.
   */
  private getMatchTimeForPlayer(player: hz.Player): number | undefined {
    // Here we are assuming there's some existing manager or state in the game that holds player times
    // If you can find that, you can use that instead of this placeholder
    // For now, I'm returning an example time of 60 seconds
    return 60; // Replace with actual match time retrieval logic
  }
}

// Register the PlayerVictoryTrigger component with the framework
hz.Component.register(PlayerVictoryTrigger);
