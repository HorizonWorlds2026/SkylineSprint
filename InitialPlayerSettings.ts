import * as hz from 'horizon/core';

export class InitialPlayerSettings extends hz.Component<typeof InitialPlayerSettings> {
    static propsDefinition = {
        playerSpeed: { type: hz.PropTypes.Number, default: 12 }, // Default player speed
        playerGravity: { type: hz.PropTypes.Number, default: 1.5 }, // Default player gravity
        OOBWorldYHeight: { type: hz.PropTypes.Number, default: -10 }, // Out-of-bounds height threshold
        respawnLocation: { type: hz.PropTypes.Vec3 }, // Respawn location
    };

    private asyncIntervalID: number = 0; // Interval ID for periodic checks

    start() {
        console.log("InitialPlayerSettings component started...");

        // Apply settings to all players in the game
        this.applySettingsToAllPlayers();

        // Connect to player enter world event
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterWorld,
            (player: hz.Player) => {
                console.log(`Player ${player.name.get()} entered the world. Applying settings...`);
                this.applySettingsToPlayerWithDelay(player);
            }
        );

        // Periodically check for out-of-bounds players
        this.asyncIntervalID = this.async.setInterval(() => {
            this.world.getPlayers().forEach((player) => {
                if (player.position.get().y < this.props.OOBWorldYHeight) {
                    console.log(`Player ${player.name.get()} detected out of bounds.`);
                    this.respawnPlayer(player); // Respawn the player
                    this.applySettingsToPlayerWithDelay(player); // Reapply settings after respawn
                }
            });
        }, 500); // Check every 500ms
    }

    dispose() {
        // Clear the interval when the component is destroyed
        this.async.clearInterval(this.asyncIntervalID);
    }

    /**
     * Respawns a player to the default or specified respawn location.
     * @param player The player to respawn.
     */
    private respawnPlayer(player: hz.Player): void {
        if (this.props.respawnLocation) {
            console.log(`Respawning player ${player.name.get()} to respawn location.`);
            player.position.set(this.props.respawnLocation);
        } else {
            console.warn("Respawn location is not set. Ensure a default location is configured.");
        }
    }

    /**
     * Apply settings to a specific player with a delay.
     * @param player The player to apply settings to.
     */
    private applySettingsToPlayerWithDelay(player: hz.Player): void {
        if (player?.id) {
            console.log(`Preparing to apply settings to player ${player.name.get()}...`);
            this.async.setTimeout(() => {
                try {
                    player.locomotionSpeed.set(this.props.playerSpeed); // Apply speed
                    player.gravity.set(this.props.playerGravity); // Apply gravity
                    console.log(`Settings applied to player ${player.name.get()}: speed=${this.props.playerSpeed}, gravity=${this.props.playerGravity}`);
                } catch (error) {
                    console.error(`Error applying settings to player ${player.name.get()}:`, error);
                }
            }, 200); // Delay ensures no conflicts with default behavior
        } else {
            console.warn("Invalid player object received.");
        }
    }

    /**
     * Apply settings to all players currently in the world.
     */
    private applySettingsToAllPlayers(): void {
        this.world.getPlayers().forEach((player) => {
            console.log(`Applying settings to player ${player.name.get()} already in the world.`);
            this.applySettingsToPlayerWithDelay(player);
        });
    }
}

// Register the component
hz.Component.register(InitialPlayerSettings);
