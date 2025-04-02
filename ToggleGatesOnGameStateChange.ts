/**
 * Works with game state to specifically control the gates at the start of a match.
 * Handles the opening and closing of gates based on the current game state, ensuring proper flow from start to end of a match.
 */
import { GameState } from 'GameUtils';
import { Events } from "Events";
import * as hz from 'horizon/core';

class ToggleGatesOnGameStateChange extends hz.Component<typeof ToggleGatesOnGameStateChange> {

  static propsDefinition = {
    // In the future, when there is an entity array, we can use that, but for now,
    // we hard code access to all barriers and use the parent objects if needed.
    enterGate1: { type: hz.PropTypes.Entity }, // Entry gate 1 entity reference
    enterGate2: { type: hz.PropTypes.Entity }, // Entry gate 2 entity reference

    exitGate1: { type: hz.PropTypes.Entity }, // Exit gate 1 entity reference
    exitGate2: { type: hz.PropTypes.Entity }, // Exit gate 2 entity reference
  };

  // Called before the component is fully started
  preStart() {
    // Prepare the start area for a new race at the beginning
    this.prepareStartAreaForRace();

    // Connect to the event that is fired when the game state changes
    this.connectLocalBroadcastEvent(
      Events.onGameStateChanged,
      (data) => {
        // When the game state changes from StartingMatch to PlayingMatch, close the start area
        if (data.fromState === GameState.StartingMatch && data.toState === GameState.PlayingMatch) {
          this.closeStartAreaForMatch();
        }
        // When the game state changes to either CompletedMatch or ReadyForMatch, prepare the start area
        else if (data.toState === GameState.CompletedMatch || data.toState === GameState.ReadyForMatch) {
          this.prepareStartAreaForRace();
        }
      });
  }

  // Empty start method that can be overridden if necessary
  start() { }

  // Close the start area gates at the beginning of the match
  private closeStartAreaForMatch() {
    // Activate entry barriers to prevent players from entering
    this.setBarrierActive(true, this.props.enterGate1);
    this.setBarrierActive(true, this.props.enterGate2);

    // Deactivate exit barriers to allow players to leave
    this.setBarrierActive(false, this.props.exitGate1);
    this.setBarrierActive(false, this.props.exitGate2);
  }

  // Prepare the start area gates for the beginning of a race
  private prepareStartAreaForRace() {
    // Deactivate entry barriers to allow players to enter
    this.setBarrierActive(false, this.props.enterGate1);
    this.setBarrierActive(false, this.props.enterGate2);

    // Activate exit barriers to prevent players from leaving prematurely
    this.setBarrierActive(true, this.props.exitGate1);
    this.setBarrierActive(true, this.props.exitGate2);
  }

  // Set a barrier's state to active or inactive
  private setBarrierActive(isActivated: boolean, barrierEntity: hz.Entity | undefined) {
    // Set the collidable property to make the barrier act as a physical blocker
    barrierEntity?.collidable.set(isActivated);

    // If the barrier has an animation, control its animation state accordingly
    const animEnt = barrierEntity?.as(hz.AnimatedEntity);
    if (animEnt) {
      if (isActivated) {
        animEnt.stop(); // Stop the animation when activated (closed)
      }
      else {
        animEnt.play(); // Play the animation when deactivated (opened)
      }
    }
    // If no animation is available, just control its visibility
    else {
      barrierEntity?.visible.set(isActivated);
    }
  }

  // Empty dispose method to handle cleanup if needed
  dispose() { }

}

// Register the component with the framework
hz.Component.register(ToggleGatesOnGameStateChange);
