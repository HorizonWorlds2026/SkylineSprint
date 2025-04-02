import * as hz from 'horizon/core';

class LeaderboardManager extends hz.Component<typeof LeaderboardManager> {
  static propsDefinition = {
    // Define any properties needed here
  };

  private leaderboard: Map<hz.Player, number> = new Map();

  start() {
    // This method is required for initializing your component
    console.log('LeaderboardManager has started.');
  }

  public addPlayerToLeaderboard(player: hz.Player, matchTime: number) {
    // Add the player to the leaderboard with the specified time
    console.log(`Adding player ${player.name.get()} with time: ${matchTime}`);
    this.leaderboard.set(player, matchTime);
  }

  public updateLeaderboard() {
    console.log('Updating leaderboard...');
    // Sort players by their match times in ascending order
    const sortedLeaderboard = Array.from(this.leaderboard.entries()).sort((a, b) => a[1] - b[1]);
    
    // Display the leaderboard information in the console
    sortedLeaderboard.forEach((entry, index) => {
      console.log(`${index + 1}. Player: ${entry[0].name.get()}, Time: ${entry[1]} seconds`);
    });
  }
}

hz.Component.register(LeaderboardManager);
