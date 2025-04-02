import { Events } from "Events";
import * as hz from 'horizon/core';

/**
 * PlayerOOBRespawner Component
 * This component is a simple script that registers the spawner entity to the manager when it starts.
 * It sends a broadcast event to inform other components or systems that this spawner is available for use.
 */
export class PlayerOOBRespawner extends hz.Component<typeof PlayerOOBRespawner> {
    /**
     * Start lifecycle method
     * This method is called when the component starts, and it registers the entity to the manager.
     * It sends a local broadcast event to indicate that this entity is a registered out-of-bounds respawner.
     */
    start() {
        // Broadcast an event to register this entity as an Out-Of-Bounds respawner
        this.sendLocalBroadcastEvent(Events.onRegisterOOBRespawner, { caller: this.entity });
    }
}

// Register the PlayerOOBRespawner component with the framework
hz.Component.register(PlayerOOBRespawner);
