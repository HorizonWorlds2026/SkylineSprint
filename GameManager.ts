/**
 * Controls the overall game state of the world, listening to events occurring and transitioning the game state accordingly.
 * Handles different stages of the match, from Ready to Starting, Playing, Ending, and Completed states.
 */
import * as hz from 'horizon/core';
import { Events } from "Events";
import { timedIntervalActionFunction, GameState, PlayerGameStatus } from 'GameUtils';
import { MatchManager } from 'MatchManager';

export class GameManager extends hz.Component<typeof GameManager> {

  // Define the properties for this component
  static propsDefinition = {
    startLineGameStateUI: { type: hz.PropTypes.Entity }, // UI entity for displaying game state at the start line
    finishLineGameStateUI: { type: hz.PropTypes.Entity }, // UI entity for displaying game state at the finish line

    timeToMatchStartMS: { type: hz.PropTypes.Number, default: 3000 }, // Time before match starts in milliseconds
    timeToMatchEndMS: { type: hz.PropTypes.Number, default: 3000 }, // Time before match ends in milliseconds
    timeNewMatchReadyMS: { type: hz.PropTypes.Number, default: 3000 }, // Time before a new match becomes ready in milliseconds

    minTimeToShowStartPopupsMS: { type: hz.PropTypes.Number, default: 3000 }, // Minimum time to show start popups in milliseconds
    minTimeToShowEndPopupsMS: { type: hz.PropTypes.Number, default: 10000 }, // Minimum time to show end popups in milliseconds

    playersNeededForMatch: { type: hz.PropTypes.Number, default: 1 }, // Number of players needed to start a match
  };

  private currentGameState = GameState.ReadyForMatch; // Tracks the current game state
  private startMatchTimerID = 0; // Timer ID for match start
  private endMatchTimerID = 0; // Timer ID for match end
  private newMatchTimerID = 0; // Timer ID for new match readiness

  private startLineGameStateUI: hz.TextGizmo | null = null; // UI entity for the start line
  private finishLineGameStateUI: hz.TextGizmo | null = null; // UI entity for the finish line

  static s_instance: GameManager; // Singleton instance of the GameManager

  constructor() {
    super();
    if (GameManager.s_instance === undefined) {
      GameManager.s_instance = this;
    } else {
      console.error(`There are two ${this.constructor.name} in the world!`);
      return;
    }
  }

  // Called before the component is fully started
  preStart() {
    this.currentGameState = GameState.ReadyForMatch;
    this.startLineGameStateUI = this.props.startLineGameStateUI!.as(hz.TextGizmo)!;
    this.finishLineGameStateUI = this.props.finishLineGameStateUI!.as(hz.TextGizmo)!;

    // Event: Trigger when a player joins standby
    this.connectLocalBroadcastEvent(Events.onPlayerJoinedStandby, () => {
      const totalPlayerStandby = MatchManager.getInstance().getPlayersWithStatus(PlayerGameStatus.Standby).length;
      if (totalPlayerStandby >= this.props.playersNeededForMatch) {
        this.transitFromReadyToStarting(); // Start the match if enough players are available
      }
    });

    // Event: Trigger when a player leaves standby
    this.connectLocalBroadcastEvent(Events.onPlayerLeftStandby, () => {
      const totalPlayerInStandby = MatchManager.getInstance().getPlayersWithStatus(PlayerGameStatus.Standby).length;
      if (totalPlayerInStandby < this.props.playersNeededForMatch) {
        // If there are not enough players to start, transition to Ready state
        if (this.currentGameState === GameState.StartingMatch) {
          this.transitFromStartingToReady();
        } else {
          console.error("Invalid state to transition from");
        }
      }
    });

    // Event: Handle when the last player leaves the world
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, (player: hz.Player) => {
      if (this.world.getPlayers().length === 0) {
        this.sendNetworkBroadcastEvent(Events.onResetWorld, {}); // Reset the world if all players leave
        console.warn("All players left, resetting world");
      }
      this.reset(); // Reset the game state
    });

    // Event: Trigger when a player reaches the goal
    this.connectLocalBroadcastEvent(Events.onPlayerReachedGoal, () => {
      this.transitFromPlayingToEnding(); // Transition from playing state to ending state
    });
  }

  // Empty start method that can be overridden if necessary
  start() { }

  // General function to transition game states
  private transitGameState(fromState: GameState, toState: GameState) {
    if (fromState === toState) {
      console.warn(`Trying to transit to the same state ${GameState[fromState]}, skipping`);
      return false;
    } else if (fromState !== this.currentGameState) {
      console.warn(`Trying to transit from ${GameState[fromState]} when Current state is ${GameState[this.currentGameState]} `);
      return false;
    } else {
      console.log(`Transiting from ${GameState[fromState]} to ${GameState[toState]}`);
      this.currentGameState = toState;
      this.sendLocalBroadcastEvent(Events.onGameStateChanged, { fromState, toState });
      return true;
    }
  }

  // Transition from Starting to Ready state
  private transitFromStartingToReady(): void {
    const transited = this.transitGameState(GameState.StartingMatch, GameState.ReadyForMatch);
    if (!transited) return;
    this.reset();
  }

  // Transition from Completed to Ready state
  private transitFromCompletedToReady(): void {
    const transited = this.transitGameState(GameState.CompletedMatch, GameState.ReadyForMatch);
    if (!transited) return;
    this.reset();
  }

  // Transition from Ready to Starting state
  private transitFromReadyToStarting(): void {
    const transited = this.transitGameState(GameState.ReadyForMatch, GameState.StartingMatch);
    if (!transited) return;

    // Set a timer for the match to start
    this.startMatchTimerID = timedIntervalActionFunction(this.props.timeToMatchStartMS, this,
      (timerMS) => {
        const infoStr = `Match Starting in ${timerMS / 1000}!`;
        this.updateGameStateUI(infoStr);
        this.sendLocalBroadcastEvent(Events.onGameStartTimeLeft, { timeLeftMS: timerMS });
        if (timerMS < this.props.minTimeToShowStartPopupsMS) {
          this.world.ui.showPopupForEveryone(infoStr, 1);
        }
      },
      this.transitFromStartingToPlaying.bind(this)
    );
  }

  // Transition from Starting to Playing state
  private transitFromStartingToPlaying(): void {
    const transited = this.transitGameState(GameState.StartingMatch, GameState.PlayingMatch);
    if (!transited) return;
    this.updateGameStateUI(`Game On!`);
  }

  // Transition from Playing to Ending state
  private transitFromPlayingToEnding(): void {
    const transited = this.transitGameState(GameState.PlayingMatch, GameState.EndingMatch);
    if (!transited) return;

    // Set a timer for the match to end
    this.endMatchTimerID = timedIntervalActionFunction(this.props.timeToMatchEndMS, this,
      (timerMS) => {
        const infoStr = `Match Ending in ${timerMS / 1000}!`;
        this.updateGameStateUI(infoStr);
        if (timerMS < this.props.minTimeToShowEndPopupsMS) {
          this.world.ui.showPopupForEveryone(infoStr, 1);
        }
        this.sendLocalBroadcastEvent(Events.onGameEndTimeLeft, { timeLeftMS: timerMS });
      },
      this.transitFromEndingToCompleted.bind(this)
    );
  }

  // Transition from Ending to Completed state
  private transitFromEndingToCompleted(): void {
    const transited = this.transitGameState(GameState.EndingMatch, GameState.CompletedMatch);
    if (!transited) return;

    // Set a timer for a new match to become available
    this.newMatchTimerID = timedIntervalActionFunction(this.props.timeNewMatchReadyMS, this,
      (timerMS) => {
        const infoStr = `New Match Available in ${timerMS / 1000}!`;
        this.updateGameStateUI(infoStr);
        this.world.ui.showPopupForEveryone(infoStr, this.props.timeNewMatchReadyMS / 1000);
      },
      this.transitFromCompletedToReady.bind(this)
    );
  }

  // Update the UI entities with the provided text
  private updateGameStateUI(text: string): void {
    this.startLineGameStateUI?.text.set(text);
    this.finishLineGameStateUI?.text.set(text);
  }

  // Reset the game state and clear all timers
  private reset() {
    this.currentGameState = GameState.ReadyForMatch;
    this.updateGameStateUI('Ready');
    this.async.clearInterval(this.startMatchTimerID);
    this.async.clearInterval(this.endMatchTimerID);
    this.async.clearInterval(this.newMatchTimerID);
  }

  // Dispose method to clean up when the component is destroyed
  dispose() { this.reset(); }
}

// Register the component with the framework
hz.Component.register(GameManager);
