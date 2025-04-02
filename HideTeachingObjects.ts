import * as hz from 'horizon/core';
import { PropTypes } from 'horizon/core';

/**
 * HideTeachingObjects Component
 * This component is responsible for controlling the visibility of a specific target entity.
 * It can be used to hide or show objects based on a boolean property.
 */
class HideTeachingObjects extends hz.Component<typeof HideTeachingObjects> {
  // Define the properties available in the component's property panel
  static propsDefinition = {
    target: { type: PropTypes.Entity }, // The entity whose visibility is controlled
    visible: { type: PropTypes.Boolean, default: false } // Boolean value to set visibility (default is false, i.e., hidden)
  };

  // Called when the component starts
  start() {
    // Get the target entity from the properties
    const target = this.props.target!;
    // Set the visibility of the target entity based on the 'visible' property
    target.visible.set(this.props.visible);
  }
}

// Register the component with the framework
hz.Component.register(HideTeachingObjects);