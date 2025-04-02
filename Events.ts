import * as hz from "horizon/core";
import { GameState } from "GameUtils";

/**
 * Events object defines all the local and network events used within the game.
 * These events cover game state changes, player actions, controller settings, match-related activities, and other in-game actions.
 */
export const Events = {
  // Game State Events
  onGameStateChanged: new hz.LocalEvent<{ fromState: GameState; toState: GameState; }>("onGameStateChanged"),
  // Event fired when the game state changes (e.g., from Lobby to Playing Match).
  onGameStartTimeLeft: new hz.LocalEvent<{ timeLeftMS: number }>("onGameStartTimeLeft"),
  // Event that provides the remaining time before the game starts.
  onGameEndTimeLeft: new hz.LocalEvent<{ timeLeftMS: number }>("onGameEndTimeLeft"),
  // Event that provides the remaining time before the game ends.
  onResetWorld: new hz.NetworkEvent("onResetWorld"),
  // Network event that resets the entire game world.
  onResetLocalObjects: new hz.NetworkEvent("onResetLocalObjects"),
  // Network event that resets local in-game objects.

  // Player Match Events
  onRegisterPlayerForMatch: new hz.LocalEvent<{ player: hz.Player }>("onRegisterPlayerForMatch"),
  // Event fired to register a player for a match.
  onDeregisterPlayerForMatch: new hz.LocalEvent<{ player: hz.Player }>("onDeregisterPlayerForMatch"),
  // Event fired to deregister a player from a match.
  onPlayerJoinedStandby: new hz.LocalEvent<{ player: hz.Player }>("onPlayerJoinedStandby"),
  // Event fired when a player joins the standby phase before a match starts.
  onPlayerLeftStandby: new hz.LocalEvent<{ player: hz.Player }>("onPlayerLeftStandby"),
  // Event fired when a player leaves the standby phase.
  onPlayerLeftMatch: new hz.LocalEvent<{ player: hz.Player }>("onPlayerLeftMatch"),
  // Event fired when a player leaves an ongoing match.
  onPlayerReachedGoal: new hz.LocalEvent<{ player: hz.Player, matchTime: number }>("onPlayerReachedGoal"),
  // Event fired when a player reaches the goal in a match.

  // Player Controller Events
  onRegisterPlyrCtrl: new hz.LocalEvent<{ caller: hz.Entity }>("onRegisterPlyrCtrl"),
  // Event fired to register a player controller.
  onGetPlyrCtrlData: new hz.NetworkEvent<{ caller: hz.Player }>("onGetPlyrCtrlData"),
  // Network event to request player controller data.
  onSetPlyrCtrlData: new hz.NetworkEvent<{ doubleJumpAmount: number; boostJumpAmount: number; boostJumpAngle: number; }>("onSetPlyrCtrlData"),
  // Network event to update player controller data, including jump and boost properties.

  // Player Boost and Double Jump Events
  onPlayerGotBoost: new hz.NetworkEvent("onPlayerGotBoost"),
  // Network event fired when a player receives a boost.
  onPlayerUsedBoost: new hz.LocalEvent("onPlayerUsedBoost"),
  // Local event fired when a player uses their boost ability.
  onPlayerUsedDoubleJump: new hz.LocalEvent("onPlayerUsedDoubleJump"),
  // Local event fired when a player uses their double jump ability.

  // Out of Bounds Events
  onRegisterOOBRespawner: new hz.LocalEvent<{ caller: hz.Entity }>("onRegisterOOBRespawner"),
  // Event fired to register an out-of-bounds respawner.
  onGetOOBRespawnerData: new hz.NetworkEvent<{ caller: hz.Entity }>("onGetOOBRespawnerData"),
  // Network event to request data from an out-of-bounds respawner.
  onSetOOBRespawnerData: new hz.NetworkEvent<{ intervalMS: number; OOBWorldYHeight: number }>("onSetOOBRespawnerData"),
  // Network event to set parameters for out-of-bounds respawners.
  onPlayerOutOfBounds: new hz.NetworkEvent("onPlayerOutOfBounds"),
  // Network event fired when a player goes out of bounds.

  // Race HUD and Position Update Events
  onRegisterRaceHUD: new hz.LocalEvent<{ caller: hz.Entity }>("onRegisterRaceHUD"),
  // Event fired to register a race HUD entity.
  onRacePosUpdate: new hz.NetworkEvent<{ playerPos: number; totalRacers: number; matchTime: number }>("onRacePosUpdate"),
  // Network event to update the player's race position.
  onStopRacePosUpdates: new hz.NetworkEvent("onStopRacePosUpdates"),
  // Network event to stop race position updates.

  // Leaderboard Event
  onUpdateLeaderboard: new hz.LocalEvent<{ player: hz.Player, matchTime: number }>("onUpdateLeaderboard")
  // Event fired to update the leaderboard after a player completes a match.
};
