import { Component, Entity, Player, CodeBlockEvents, World } from 'horizon/core';

// Define a new component called VisitorLeaderboard, which will track player visits and maintain a leaderboard.
class VisitorLeaderboard extends Component<typeof VisitorLeaderboard> {
  
  /**
   * Called when the component starts.
   * Initializes the component by logging a message and setting up an event listener
   * for when players enter the world.
   */
  start() {
    console.log('VisitorLeaderboard component initialized.');

    // Set up an event listener for the OnPlayerEnterWorld event.
    // When a player enters the world, the onPlayerEnterWorld method will be called.
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      this.onPlayerEnterWorld.bind(this)
    );
  }

  /**
   * Event handler called when a player enters the world.
   * This method updates the number of visits for the player and then updates the leaderboard.
   * 
   * @param player - The player who entered the world.
   */
  private async onPlayerEnterWorld(player: Player) {
    try {
      // Get the number of times the player has visited the world.
      const visits = await this.getVisits(player);
      // Increment the visit count and update both the player's visit record and the leaderboard.
      await this.updateVisitsAndLeaderboard(player, visits + 1);
    } catch (error) {
      // Log an error if there was an issue with processing the player's entry.
      console.error(`Error processing player entry: ${error}`);
    }
  }

  /**
   * Retrieves the number of visits for a given player from persistent storage.
   * If there is no record, it will default to 0.
   * 
   * @param player - The player for whom the visits are being retrieved.
   * @returns A promise that resolves to the number of visits.
   */
  private async getVisits(player: Player): Promise<number> {
    try {
      // Attempt to get the "visits" variable from persistent storage for the given player.
      const visits = await this.world.persistentStorage.getPlayerVariable(player, 'visits');
      // If the retrieved visits is null (meaning there's no record), return 0; otherwise, return the parsed value.
      return visits === null ? 0 : parseInt(visits.toString());
    } catch (error) {
      // If there is an error retrieving the visits, log it and default to 0.
      console.error(`Error retrieving visits: ${error}`);
      return 0;
    }
  }

  /**
   * Updates the player's visit count and the leaderboard.
   * 
   * @param player - The player whose visit count needs to be updated.
   * @param visits - The updated number of visits.
   */
  private async updateVisitsAndLeaderboard(player: Player, visits: number) {
    try {
      // Update the player's visits count in persistent storage.
      await this.updateVisits(player, visits);
      // Update the leaderboard with the new number of visits.
      await this.updateLeaderboard(player, visits);
    } catch (error) {
      // Log an error if there was an issue updating the visits or the leaderboard.
      console.error(`Error updating visits or leaderboard: ${error}`);
    }
  }

  /**
   * Updates the number of visits in persistent storage for the given player.
   * 
   * @param player - The player whose visits count is being updated.
   * @param visits - The number of visits to store.
   */
  private async updateVisits(player: Player, visits: number) {
    try {
      // Set the "visits" variable in persistent storage for the player.
      await this.world.persistentStorage.setPlayerVariable(player, 'visits', visits.toString());
      console.log(`Updated visits for ${player.name.get()}: ${visits}`);
    } catch (error) {
      // Log an error if there was an issue updating the visits.
      console.error(`Error updating visits: ${error}`);
    }
  }

  /**
   * Updates the leaderboard with the given player's visit count.
   * 
   * @param player - The player whose score is being updated on the leaderboard.
   * @param visits - The number of visits to set as the player's score.
   */
  private async updateLeaderboard(player: Player, visits: number) {
    try {
      // Update the leaderboard with the player's current number of visits.
      // The third parameter (true) indicates that the leaderboard should allow updates to the player's score.
      await this.world.leaderboards.setScoreForPlayer('VisitorLeaderboard', player, visits, true);
      console.log(`Leaderboard updated for ${player.name.get()}.`);
    } catch (error) {
      // Log an error if there was an issue updating the leaderboard.
      console.error(`Error updating leaderboard: ${error}`);
    }
  }
}

// Register the VisitorLeaderboard component so it can be used within the game engine.
// This allows instances of VisitorLeaderboard to be attached to entities in the game.
Component.register(VisitorLeaderboard);
