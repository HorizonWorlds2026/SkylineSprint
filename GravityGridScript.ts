import { Component, PropTypes, Entity, Player, CodeBlockEvents } from 'horizon/core';

/**
 * Gravity Grid Trigger class.
 * This component modifies the player's speed and gravity when they enter a trigger area.
 * The player speed and gravity can be customized using component properties both when entering and exiting the trigger area.
 */
class GravityGridTrigger extends Component<typeof GravityGridTrigger> {
  // Define the properties of the component
  static propsDefinition = {
    triggerID: { type: PropTypes.Entity }, // Reference to the trigger entity that activates the effect
    locomotionSpeed: { type: PropTypes.Number, default: 13 }, // Customizable speed value for player on entering the trigger
    gravity: { type: PropTypes.Number, default: 1.5 }, // Customizable gravity value for player on entering the trigger
    exitLocomotionSpeed: { type: PropTypes.Number, default: 4.6 }, // Customizable speed value for player on exiting the trigger
    exitGravity: { type: PropTypes.Number, default: 8.6 }, // Customizable gravity value for player on exiting the trigger
  };

  // Called when the component starts
  start() {
    // Get the trigger entity from the properties. This is the entity that the player interacts with.
    const trigger = this.props.triggerID!.as(Entity); 

    // Connect to the event that fires when a player enters the trigger area
    this.connectCodeBlockEvent(
      trigger,
      CodeBlockEvents.OnPlayerEnterTrigger, // Event triggered when a player enters the trigger zone
      (player: Player) => this.onTriggerEnter(player) // Bind the onTriggerEnter function to handle the event
    );

    // Connect to the event that fires when a player exits the trigger area
    this.connectCodeBlockEvent(
      trigger,
      CodeBlockEvents.OnPlayerExitTrigger, // Event triggered when a player exits the trigger zone
      (player: Player) => this.onTriggerExit(player) // Bind the onTriggerExit function to handle the event
    );
  }

  /**
   * Function called when a player enters the trigger
   * This modifies the player's speed and gravity using the configurable component properties.
   * @param player - The player entity that entered the trigger.
   */
  private onTriggerEnter(player: Player): void {
    if (player && player.id) { // Ensure the player is valid and has a valid ID
      // Set the player's speed using the component's property value
      player.locomotionSpeed.set(this.props.locomotionSpeed);

      // Set the player's gravity using the component's property value
      player.gravity.set(this.props.gravity);

      // Log the action for debugging purposes
      console.log(`Player ${player.name.get()} entered trigger: Speed set to ${this.props.locomotionSpeed}, Gravity set to ${this.props.gravity}`);
    }
  }

  /**
   * Function called when a player exits the trigger
   * This resets the player's speed and gravity to configurable exit values.
   * @param player - The player entity that exited the trigger.
   */
  private onTriggerExit(player: Player): void {
    if (player && player.id) { // Ensure the player is valid and has a valid ID
      // Reset the player's speed to the configured default exit value
      player.locomotionSpeed.set(this.props.exitLocomotionSpeed);

      // Reset the player's gravity to the configured default exit value
      player.gravity.set(this.props.exitGravity);

      // Log the action for debugging purposes
      console.log(`Player ${player.name.get()} exited trigger: Speed reset to ${this.props.exitLocomotionSpeed}, Gravity reset to ${this.props.exitGravity}`);
    }
  }
}

// Register the component with the framework to make it available for use
Component.register(GravityGridTrigger);
