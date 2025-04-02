import { Component, PropTypes, Entity, Player, CodeBlockEvents, Quaternion, Vec3 } from 'horizon/core';

/**
 * ReturnToOriginComponent class.
 * This component makes an entity return to its original position and rotation after a delay.
 */
class ReturnToOriginComponent extends Component<typeof ReturnToOriginComponent> {
  // Define the properties of the component, which can be configured
  static propsDefinition = {
    delay: { type: PropTypes.Number, default: 3 }, // Delay before returning to original position in seconds
    returnTime: { type: PropTypes.Number, default: 2 }, // Time taken to return to original position
  };

  // Original position and rotation variables to store the entity's initial state
  private originalPosition!: Vec3; // Stores the initial position as a vector in 3D space
  private originalRotation!: Quaternion; // Stores the initial rotation as a quaternion

  // Called when the component starts (i.e., when the entity with this component is created or activated)
  start() {
    // Store the initial position and rotation of the entity for later use
    this.originalPosition = this.entity.transform.position.get(); 
    this.originalRotation = this.entity.transform.rotation.get(); 

    // Connect event handlers for when the player grabs and releases the object
    // The event handler is connected to the entity, specifically listening for the OnGrabEnd event
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, this.onGrabEnd.bind(this));
  }

  // Called when the grab ends (when the player releases the object)
  private onGrabEnd(player: Player): void {
    // Start a timer that will call the returnToOrigin function after a specified delay (in seconds)
    this.async.setTimeout(() => this.returnToOrigin(), this.props.delay * 1000);
  }

  // Function to return the entity to its original position and rotation
  private returnToOrigin(): void {
    // Disable physical simulation to allow smooth movement without interference from physics
    this.entity.simulated.set(false); 

    // Move the entity to the original position that was stored during start()
    this.entity.transform.position.set(this.originalPosition); 

    // Rotate the entity to the original rotation that was stored during start()
    this.entity.transform.rotation.set(this.originalRotation); 

    // Re-enable physical simulation after a delay equal to the return time
    // This ensures that the object can interact with physics normally after being moved back
    this.async.setTimeout(() => {
      this.entity.simulated.set(true); 
    }, this.props.returnTime * 1000);
  }
}

// Register the component with the framework to make it available for use
Component.register(ReturnToOriginComponent);
