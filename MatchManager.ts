import * as hz from 'horizon/core';
import { GameState, PlayerGameStatus } from 'GameUtils';
import { Events } from "Events";

/**
 * MatchManager Component
 * This component manages the state of the match, including handling player transitions between different match states (e.g., Lobby, Standby, Playing).
 * It teleports players to appropriate locations and updates their game status accordingly.
 */

export interface PlayerData {
  player: hz.Player; // Reference to the player entity
  playerGameStatus: PlayerGameStatus; // Current game status of the player
}

export class MatchManager extends hz.Component<typeof MatchManager> {
  static propsDefinition = {
    lobbySpawnPoint: { type: hz.PropTypes.Entity }, // Entity for the lobby spawn point
    matchSpawnPoint: { type: hz.PropTypes.Entity }, // Entity for the match spawn point
  };

  private lastKnownGameState = GameState.ReadyForMatch; // Keeps track of the current game state
  private playerMap: Map<number, PlayerData> = new Map<number, PlayerData>(); // Maps player IDs to their data
  private static s_instance: MatchManager;

  // Singleton instance getter
  public static getInstance(): MatchManager {
    return MatchManager.s_instance;
  }

  constructor() {
    super();
    if (MatchManager.s_instance === undefined) {
      MatchManager.s_instance = this;
    } else {
      console.error(`There are two ${this.constructor.name} in the world!`);
      return;
    }
  }

  subscriptions: Array<hz.EventSubscription> = [];

  // Pre-start lifecycle method to initialize event listeners
  preStart() {
    // Handle player entering the world
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
      this.handleOnPlayerEnterWorld(player);
    });

    // Handle player exiting the world
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, (player: hz.Player) => {
      this.handleOnPlayerExitWorld(player);
    });

    // Handle changes in game state
    this.connectLocalBroadcastEvent(Events.onGameStateChanged, (data) => {
      this.handleGameStateTransit(data.fromState, data.toState);
    });

    // Handle player registration for the match (standby)
    this.connectLocalBroadcastEvent(Events.onRegisterPlayerForMatch, (data) => {
      this.handlePlayerRegisterStandby(data.player);
    });

    // Handle player deregistration from the match (standby)
    this.connectLocalBroadcastEvent(Events.onDeregisterPlayerForMatch, (data) => {
      this.handlePlayerDeregisterStandby(data.player);
    });

    // Handle world reset
    this.connectNetworkBroadcastEvent(Events.onResetWorld, (data) => {
      this.reset();
      this.playerMap.forEach((pd) => {
        this.sendNetworkEvent(pd.player, Events.onResetLocalObjects, {});
      });
    });
  }

  // Empty start method that can be overridden if needed
  start() {}

  // Get players by their game status (e.g., Lobby, Standby, Playing)
  public getPlayersWithStatus(playerGameStatus: PlayerGameStatus): Array<hz.Player> {
    return Array.from(this.playerMap.values())
      .filter(value => value.playerGameStatus === playerGameStatus)
      .map(value => value.player);
  }

  // Handle game state transitions and update player status accordingly
  private handleGameStateTransit(fromState: GameState, toState: GameState) {
    this.lastKnownGameState = toState;

    if (fromState === GameState.StartingMatch && toState === GameState.PlayingMatch) {
      // Game is starting - teleport players to match area
      const matchSpawnPointGiz = this.props.matchSpawnPoint!.as(hz.SpawnPointGizmo);
      if (matchSpawnPointGiz) {
        // Teleport lobby players to the match spawn point
        this.teleportPlayersWithStatusToSpawnPoint(PlayerGameStatus.Lobby, matchSpawnPointGiz);
        this.transferAllPlayersWithStatus(PlayerGameStatus.Standby, PlayerGameStatus.Playing);
        this.transferAllPlayersWithStatus(PlayerGameStatus.Lobby, PlayerGameStatus.Playing);
      }
    }
    else if (toState === GameState.CompletedMatch) {
      // Game has ended - teleport players to the lobby area
      const lobbySpawnPointGiz = this.props.lobbySpawnPoint!.as(hz.SpawnPointGizmo);
      if (lobbySpawnPointGiz) {
        this.playerMap.forEach((playerD: PlayerData) => {
          lobbySpawnPointGiz.teleportPlayer(playerD.player);
          playerD.playerGameStatus = PlayerGameStatus.Lobby;
        });
      }
    } else if (toState === GameState.ReadyForMatch) {
      // Reset player local objects when match is ready
      this.playerMap.forEach((pd) => {
        this.sendNetworkEvent(pd.player, Events.onResetLocalObjects, {});
      });
    }
  }

  // Handle player exiting the world and update the player map
  private handleOnPlayerExitWorld(player: hz.Player): void {
    const playerData = this.playerMap.get(player.id);
    if (!playerData) {
      console.error(`player ${player.name.get()} not found in playerMap`);
      return;
    }
    this.playerMap.delete(player.id);

    // Send events based on the player's game status
    switch (playerData.playerGameStatus) {
      case PlayerGameStatus.Standby:
        this.sendLocalBroadcastEvent(Events.onPlayerLeftStandby, { player });
        break;
      case PlayerGameStatus.Playing:
        this.sendLocalBroadcastEvent(Events.onPlayerLeftMatch, { player });
        break;
      case PlayerGameStatus.Lobby:
        break;
    }
  }

  // Handle player entering the world and add them to the lobby
  private handleOnPlayerEnterWorld(player: hz.Player): void {
    this.playerMap.set(player.id, {
      player,
      playerGameStatus: PlayerGameStatus.Lobby,
    });
  }

  // Register player for the match (standby state)
  private handlePlayerRegisterStandby(player: hz.Player): void {
    if (this.lastKnownGameState === GameState.StartingMatch || this.lastKnownGameState === GameState.ReadyForMatch) {
      this.transferPlayerWithStatus(player, PlayerGameStatus.Lobby, PlayerGameStatus.Standby);
      this.sendLocalBroadcastEvent(Events.onPlayerJoinedStandby, { player });
    }
  }

  // Deregister player from standby (move them back to lobby)
  private handlePlayerDeregisterStandby(player: hz.Player): void {
    if (this.lastKnownGameState === GameState.StartingMatch || this.lastKnownGameState === GameState.ReadyForMatch) {
      this.transferPlayerWithStatus(player, PlayerGameStatus.Standby, PlayerGameStatus.Lobby);
    }
  }

  // Transfer all players from one status to another
  private transferAllPlayersWithStatus(fromState: PlayerGameStatus, toState: PlayerGameStatus) {
    this.playerMap.forEach((playerData: PlayerData) => {
      if (playerData.playerGameStatus === fromState) {
        playerData.playerGameStatus = toState;
      }
    });
  }

  // Transfer a single player from one status to another
  private transferPlayerWithStatus(player: hz.Player, fromState: PlayerGameStatus, toState: PlayerGameStatus): void {
    if (fromState === toState) {
      console.warn(`You are trying to move player ${player.name.get()} into the same state ${PlayerGameStatus[fromState]}. Skipping`);
      return;
    }

    const playerData = this.playerMap.get(player.id);
    if (!playerData) {
      console.error(`player ${player.name.get()} not found in playerMap`);
      return;
    }

    if (playerData.playerGameStatus !== fromState) {
      console.warn(`You are trying to move player ${player.name.get()} into the same state ${fromState}. Skipping`);
    }
    playerData.playerGameStatus = toState;
  }

  // Teleport players with a specific status to a spawn point
  private teleportPlayersWithStatusToSpawnPoint(status: PlayerGameStatus, spawnPoint: hz.SpawnPointGizmo) {
    this.playerMap.forEach((playerD: PlayerData) => {
      if (playerD.playerGameStatus === status) {
        spawnPoint.teleportPlayer(playerD.player);
      }
    });
  }

  // Reset the match state and clear player data
  private reset() {
    this.lastKnownGameState = GameState.ReadyForMatch;
    this.playerMap.clear();
  }

  // Dispose method to reset the match state when the component is destroyed
  dispose() { this.reset(); }
}

// Register the MatchManager component with the framework
hz.Component.register(MatchManager);
