/**
 * This manager is responsible for tracking the player progress around the race and the race UI.
 */

import * as hz from 'horizon/core';
import { Curve, PlayerGameStatus, CurveVisualizer, GameState, msToMinutesAndSeconds } from 'GameUtils';
import { Events } from "Events";
import { MatchManager } from 'MatchManager';

// Defines the structure for a race participant, including the player reference, last known race time, race progress, and position.
type RaceParticipant = { 
  player: hz.Player, 
  lastKnownRaceTime: number, 
  lastKnownRaceProgress: number, 
  lastKnownPosition: hz.Vec3 
};

export class RaceManager extends hz.Component<typeof RaceManager> {
  
  static propsDefinition = {
    startLineRaceUI: { type: hz.PropTypes.Entity }, // Reference to the UI component at the start line
    finishLineRaceUI: { type: hz.PropTypes.Entity }, // Reference to the UI component at the finish line
    trackPointsParent: { type: hz.PropTypes.Entity }, // Entity that holds all the track points for race calculations
    curveVisualizer: { type: hz.PropTypes.Entity }, // Entity responsible for visualizing the race curve
  };

  private raceUpdateIntervalID: number = 0; // Interval ID for updating race progress
  
  private raceCurve!: Curve; // Represents the race path using a curve with multiple checkpoints
  private raceParticipants = new Map<number, RaceParticipant>(); // Maps player ID to their respective race progress data
  private raceWinners = new Set<RaceParticipant>(); // Set containing all the players who have finished the race
  private matchTime = 0; // Current match time in milliseconds
  
  private startLineRaceUI: hz.TextGizmo | null = null; // UI component at the start line
  private finishLineRaceUI: hz.TextGizmo | null = null; // UI component at the finish line

  private readonly defaultRaceUIText = ""; // Default text for race UI

  private static s_instance: RaceManager;
  public static getInstance(): RaceManager {
    return RaceManager.s_instance;
  }

  constructor() {
    super();
    if (RaceManager.s_instance === undefined) {
      RaceManager.s_instance = this;
    } else {
      console.error(`There are two ${this.constructor.name} in the world!`);
      return;
    }
  }

  /**
   * Sets up all the initial properties and connections before the race starts.
   */
  preStart() {
    this.startLineRaceUI = this.props.startLineRaceUI!.as(hz.TextGizmo)!;
    this.finishLineRaceUI = this.props.finishLineRaceUI!.as(hz.TextGizmo)!;

    // Listen for the event when a player reaches the goal
    this.connectLocalBroadcastEvent(Events.onPlayerReachedGoal,
      (data) => {
        this.playerFinishedRace(data.player);
      });

    // Listen for the event when a player leaves the match
    this.connectLocalBroadcastEvent(Events.onPlayerLeftMatch, (data) => {
      this.handleOnPlayerLeftMatch(data.player);
    });

    // Handle the game state changes to control the flow of the match
    this.connectLocalBroadcastEvent(Events.onGameStateChanged, (data) => {
      if (data.fromState === GameState.EndingMatch && data.toState === GameState.CompletedMatch) {
        this.handleOnMatchEnd(); // Handle end-of-match scenarios
      } else if (data.fromState === GameState.StartingMatch && data.toState === GameState.PlayingMatch) {
        this.handleOnMatchStart(); // Handle match starting scenarios
      }
    });

    // Continuously update the match time while the race is ongoing
    this.connectLocalBroadcastEvent(
      hz.World.onUpdate,
      (data) => {
        if (this.raceParticipants.size > 0) {
          this.matchTime += data.deltaTime; // Increment match time by the delta time
        }
      }
    );

    // Listen for world reset events
    this.connectNetworkBroadcastEvent(Events.onResetWorld, (data) => { this.reset() });

    // Initialize the race track curve using checkpoint positions
    this.raceCurve = this.initCurve(this.props.trackPointsParent!.children.get()!);
    this.handleUpdateRaceUI(this.defaultRaceUIText);
    this.reset(); // Reset any previous state
  }

  /**
   * Called when the race manager component is started.
   * Broadcasts the curve information to be visualized.
   */
  start() {
    this.sendLocalBroadcastEvent(CurveVisualizer.SetCurve, { curve: this.raceCurve });
  }

  /**
   * Retrieves the race participant object for a given player.
   * @param player The player whose race data is requested.
   * @returns The player's race data or null if not found.
   */
  public getRaceParticipant(player: hz.Player): RaceParticipant | null {
    return this.raceParticipants.get(player.id) || null;
  }

  /**
   * Handles the start of a match, initializing players and starting the progress tracking loop.
   */
  private handleOnMatchStart() {
    this.handleUpdateRaceUI(this.defaultRaceUIText); // Clear the UI with default text

    const distThresholdCheckProgress = 0.5; // Distance threshold for checking player movement progress
    const players = MatchManager.getInstance().getPlayersWithStatus(PlayerGameStatus.Playing);

    // Register all players who are playing as race participants
    for (let i = 0; i < players.length; i++) {
      this.raceParticipants.set(
        players[i].id,
        {
          player: players[i],
          lastKnownRaceTime: 0,
          lastKnownRaceProgress: 0,
          lastKnownPosition: hz.Vec3.zero
        });
    }

    // Start the interval that calculates the progress of each player every 500ms
    this.raceUpdateIntervalID = this.async.setInterval(() => {
      this.updateAllRacerCurveProgress(distThresholdCheckProgress);

      // Sort players by their progress along the race curve (descending order)
      const racePositions = Array.from(this.raceParticipants.values()).sort((a, b) => {
        return b.lastKnownRaceProgress - a.lastKnownRaceProgress;
      });

      // Notify players of their position in the race
      racePositions.forEach((entry, index) => {
        if (entry.player && !this.raceWinners.has(entry)) {
          this.sendNetworkEvent(entry.player,
            Events.onRacePosUpdate, {
              playerPos: (index + 1), // Position in race
              totalRacers: this.raceParticipants.size,
              matchTime: this.matchTime
          });
        }
      });
    }, 500);
  }

  /**
   * Updates the progress of all players along the race curve.
   * @param distThresholdCheckProgress The minimum distance threshold to consider a player as having moved.
   */
  private updateAllRacerCurveProgress(distThresholdCheckProgress: number) {
    this.raceParticipants.forEach((participant) => {
      const plyr = participant.player;
      if (!plyr || this.raceWinners.has(participant)) { return; }
      const plyrPos = participant.player.position.get();

      // Only update if the player has moved an appreciable distance
      if (plyrPos.distanceSquared(participant.lastKnownPosition) > distThresholdCheckProgress) {
        participant.lastKnownRaceProgress = this.raceCurve.findClosestPointCurveProgress(plyrPos);
        participant.lastKnownRaceTime = this.matchTime;
        participant.lastKnownPosition = plyrPos;
      }
    });
  }

  /**
   * Handles the end of the match, updating the UI with the final standings and resetting the race.
   */
  private handleOnMatchEnd() {
    let rollCall = this.getWinnerRollCallString(Array.from(this.raceWinners.keys()));
    const raceParticipants = Array.from(this.raceParticipants.values());

    // Mark players who did not finish the race
    for(let rp of raceParticipants) {
      if(!this.raceWinners.has(rp)) {
        rollCall += `Did Not Finish\t${rp.player.name.get()}\t[${msToMinutesAndSeconds(rp.lastKnownRaceTime)}]\n`;
      }
    }

    this.handleUpdateRaceUI(rollCall);
    this.reset();
  }

  /**
   * Handles the event when a player leaves the match.
   * @param player The player who has left the match.
   */
  private handleOnPlayerLeftMatch(player: hz.Player): void {
    if (player) {
      const rp = this.raceParticipants.get(player.id);
      if (rp) {
        this.raceWinners.delete(rp); // Remove from winners if applicable
        this.raceParticipants.delete(player.id); // Remove from participants
      }
      console.log(`${this.constructor.name} Removed player ${player.name.get()}`);
    } else {
      console.warn(`${this.constructor.name} Removed null player`);
    }
  }

  /**
   * Initializes the race curve using a list of checkpoint entities.
   * @param chckObjs The list of entities representing the checkpoints.
   * @returns The Curve object that represents the race path.
   */
  private initCurve(chckObjs: hz.Entity[]): Curve {
    let points: hz.Vec3[] = [];
    chckObjs.forEach((checkpoint) => {
      points.push(checkpoint.position.get());
    });
    return new Curve(points);
  }

  /**
   * Updates the start and finish line UI with the provided text.
   * @param text The text to set on the start and finish line UI.
   */
  private handleUpdateRaceUI(text: string): void {
    this.startLineRaceUI!.text.set(text);
    this.finishLineRaceUI!.text.set(text);
  }

  /**
   * Handles a player finishing the race, updating their progress and adding them to the winners list.
   * @param player The player that has finished the race.
   */
  private playerFinishedRace(player: hz.Player) {
    if (!player) { return; }

    const rp = this.raceParticipants.get(player.id);
    if (rp! && !this.raceWinners.has(rp)) {
      this.sendNetworkEvent(player, Events.onStopRacePosUpdates, {});

      this.raceWinners.add(rp);

      rp.lastKnownRaceProgress = 1; // Mark player as having completed the race
      rp.lastKnownRaceTime = this.matchTime;

      this.handleUpdateRaceUI(
        this.getWinnerRollCallString(Array.from(this.raceWinners.keys()))
      );
    }
  }

  /**
   * Generates a string of the race winners in order of their finish.
   * @param winningPlayers Array of race participants who finished.
   * @returns The formatted roll call string.
   */
  private getWinnerRollCallString(winningPlayers: Array<RaceParticipant>) {
    let rollCall = this.defaultRaceUIText;
    const winString = ["1st: ", "2nd: ", "3rd: ", "4th: ", "5th: ", "6th: ", "7th: ", "8th: "];

    // Limit number of winners displayed to the size of the winString array
    const maxNumOfWinners = Math.min(winString.length, winningPlayers.length);
    for (let i = 0; i < maxNumOfWinners; i++) {
      const rp = winningPlayers[i];
      rollCall += `${winString[i]}\t${rp.player.name.get()}\t[${msToMinutesAndSeconds(rp.lastKnownRaceTime)}]\n`;
    }

    return rollCall;
  }

  /**
   * Resets the race manager to the default state, clearing all participants and intervals.
   */
  private reset() {
    console.warn("RACE RESET");

    this.async.clearInterval(this.raceUpdateIntervalID);

    this.raceParticipants.forEach((data) => { 
      this.sendNetworkEvent(data.player, Events.onStopRacePosUpdates, {}) 
    });

    // Reset race state
    this.raceUpdateIntervalID = 0;
    this.raceParticipants.clear();
    this.raceWinners.clear();
    this.matchTime = 0;
  }

  /**
   * Disposes of the component, resetting the race.
   */
  dispose() { 
    this.reset(); 
  }
}

// Register the component with the Horizon framework
hz.Component.register(RaceManager);
