import * as hz from 'horizon/core';
import { Events } from 'Events';
import { RaceManager } from 'RaceManager';

/**
 * LeaderboardController Component
 * This component listens to player events, specifically when a player reaches the goal,
 * and updates the leaderboard with their race time.
 */
class LeaderboardController extends hz.Component<typeof LeaderboardController> {
  // Define properties available for configuration in the component property panel
  static propsDefinition = {
    leaderboardName: { type: hz.PropTypes.String, default: 'Leaderboard' }, // Name of the leaderboard to update
  };

  constructor() {
    super();
  }

  // Pre-start lifecycle method to initialize event listeners
  preStart() {
    // Listen to the event when a player reaches the goal
    this.connectLocalBroadcastEvent(Events.onPlayerReachedGoal, (data) => {
      const player = data.player as hz.Player; // Get the player who reached the goal

      // Find the RaceManager instance to get the player's race time
      const raceManager = RaceManager.getInstance();

      // Get the player's final race time from RaceManager
      if (raceManager) {
        const raceParticipant = raceManager.getRaceParticipant(player);
        if (raceParticipant) {
          const matchTime = Math.floor(raceParticipant.lastKnownRaceTime); // Calculate the player's race time

          // Update the leaderboard using setScoreForPlayer
          if (this.world.leaderboards) {
            this.world.leaderboards.setScoreForPlayer(this.props.leaderboardName!, player, matchTime, true);
            console.log(`Updated leaderboard with player: ${player.name.get()} and time: ${matchTime}`);
          } else {
            console.error("Leaderboards are not available in the world object.");
          }
        } else {
          console.error("Race participant data not found for player.");
        }
      } else {
        console.error("RaceManager instance not found.");
      }
    });
  }

  // Empty start method that can be overridden if needed
  start() {}
}

// Register the LeaderboardController component with the framework
hz.Component.register(LeaderboardController);
