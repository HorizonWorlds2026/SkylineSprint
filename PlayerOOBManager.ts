/**
 * Manages the player out-of-bounds (OOB) controllers, initializing them and controlling ownership.
 * Handles respawning players when they fall out of bounds and keeps track of their last known ground position.
 */
import * as hz from 'horizon/core';
import { GameState, Pool } from 'GameUtils';
import { Events } from "Events";

export class PlayerOOBManager extends hz.Component<typeof PlayerOOBManager> {
    // Define properties of the component
    static propsDefinition = {
        recordIntervalMS: { type: hz.PropTypes.Number, default: 500 }, // Interval for checking player position in milliseconds
        OOBWorldYHeight: { type: hz.PropTypes.Number, default: 50 }, // Height below which a player is considered out of bounds
        bufferRespawnYHeight: { type: hz.PropTypes.Number, default: 3 }, // Buffer height to prevent players from instantly falling again
        lobbyStartRespawnGizmo: { type: hz.PropTypes.Entity }, // Reference to the spawn point in the lobby
    };

    // Variables to track interval ID, player respawners, and state
    private asyncIntervalID: number = 0; // ID for the async interval task
    private localRespawnerPool = new Pool<hz.Entity>(); // Pool of available respawn gizmos
    private playerMap = new Map<number, {
        player: hz.Player, // Player reference
        spawner: hz.SpawnPointGizmo, // Respawner assigned to the player
        eventSub: hz.EventSubscription // Event subscription for the player
    }>();

    private respawnVecBuffer: hz.Vec3 | null = null; // Buffer to adjust the respawn position
    private lastKnownGameState = GameState.ReadyForMatch; // Track the last known game state

    private lobbyStartRespawnGizmo: hz.SpawnPointGizmo | null = null; // Reference to the lobby spawn gizmo

    private static s_instance: PlayerOOBManager // Singleton instance of the class
    public static getInstance(): PlayerOOBManager {
        return PlayerOOBManager.s_instance;
    }

    // Constructor to ensure only one instance of the class exists
    constructor() {
        super();
        if (PlayerOOBManager.s_instance === undefined) {
            PlayerOOBManager.s_instance = this;
        }
        else {
            console.error(`There are two ${this.constructor.name} in the world!`)
            return;
        }
    }

    // Called before the component is fully started
    preStart() {
        // To prevent players from falling off again, respawn them slightly above the ground
        this.respawnVecBuffer = new hz.Vec3(0, this.props.bufferRespawnYHeight, 0);
        this.lobbyStartRespawnGizmo = this.props.lobbyStartRespawnGizmo!.as(hz.SpawnPointGizmo);

        // Connect events for when a player enters or exits the game world
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterWorld,
            (player: hz.Player) => {
                this.handleOnPlayerEnterWorld(player, this.localRespawnerPool, this.playerMap);
            });

        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerExitWorld,
            (player: hz.Player) => {
                this.handleOnPlayerExitWorld(player, this.localRespawnerPool, this.playerMap);
            });

        // Listen for a new respawner being registered and add it to the pool
        this.connectLocalBroadcastEvent(Events.onRegisterOOBRespawner,
            (data) => {
                this.localRespawnerPool.addToPool(data.caller);
            });

        // Update the last known game state when it changes
        this.connectLocalBroadcastEvent(Events.onGameStateChanged,
            (data) => {
                this.lastKnownGameState = data.toState;
            });

        // Set up an interval to track players' positions and manage out-of-bounds behavior
        this.asyncIntervalID = this.async.setInterval(
            () => {
                this.playerMap.forEach((value) => {
                    let owner = value.player;
                    let pairedRespawnGizmo = value.spawner;

                    const ownerPos = owner.position.get();
                    const ownerRot = owner.rotation.get();

                    // If the player falls below the out-of-bounds height, teleport them to the respawn gizmo
                    if (ownerPos.y < this.props.OOBWorldYHeight) {
                        pairedRespawnGizmo!.teleportPlayer(owner);
                    }
                    // If the player is grounded, update the respawn gizmo position to the player's current position
                    else if (owner.isGrounded.get()) {
                        pairedRespawnGizmo.position.set(ownerPos.addInPlace(this.respawnVecBuffer!));
                        pairedRespawnGizmo.rotation.set(ownerRot);
                    }
                });
            },
            this.props.recordIntervalMS);
    }

    // Empty start method that can be overridden if necessary
    start() { }

    // Handle a player entering the game world
    private handleOnPlayerEnterWorld(
        player: hz.Player,
        objPool: Pool<hz.Entity>,
        playerMap: Map<number, {
            player: hz.Player,
            spawner: hz.SpawnPointGizmo,
            eventSub: hz.EventSubscription}>
    ): void {
        const playerRespawner = objPool.getNextAvailable(); // Get the next available respawner from the pool
        if (playerRespawner) {
            const spawnGiz = playerRespawner.as(hz.SpawnPointGizmo)!;
            console.log(`${this.constructor.name} Attached Respawner to ${player.name.get()}`);

            // Connect an event for when the player goes out of bounds
            const sub = this.connectNetworkEvent(
                player,
                Events.onPlayerOutOfBounds,
                () => {
                    // If the game is in progress, respawn at the last known ground position
                    // Otherwise, respawn them in the lobby
                    if (this.lastKnownGameState === GameState.PlayingMatch || this.lastKnownGameState === GameState.EndingMatch) {
                        spawnGiz.teleportPlayer(player);
                    }
                    else {
                        this.lobbyStartRespawnGizmo!.teleportPlayer(player);
                    }
                });
            playerMap.set(player.id, { player: player, spawner: spawnGiz, eventSub: sub }); // Add player and respawner to map
        }
    };

    // Handle a player exiting the game world
    private handleOnPlayerExitWorld(
        player: hz.Player,
        objPool: Pool<hz.Entity>,
        playerMap: Map<number, {
            player: hz.Player,
            spawner: hz.SpawnPointGizmo,
            eventSub: hz.EventSubscription
        }>): void {
        const playerRespawner = playerMap.get(player.id)?.spawner; // Get the respawner assigned to the player
        if (playerRespawner) {
            console.log(`${this.constructor.name} Removed Respawner from ${player.name.get()}`);

            objPool.addToPool(playerRespawner); // Return the respawner to the pool
            playerMap.get(player.id)!.eventSub.disconnect(); // Disconnect the player's event subscription
            playerMap.delete(player.id); // Remove the player from the map
        }
    };

    // Dispose of the component, clearing any active intervals
    dispose() {
        this.async.clearInterval(this.asyncIntervalID);
    }

}
// Register the component with the framework
hz.Component.register(PlayerOOBManager);
