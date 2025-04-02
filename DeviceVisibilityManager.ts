import * as hz from 'horizon/core';

/**
 * Component that controls entity visibility based on the player's platform (VR, Desktop, or Mobile).
 * Depending on the platform the player is using, the component will either show or hide the entity.
 */

type Props = {
  showOnVR: boolean; // Flag to determine if the entity is visible on VR
  showOnDesktop: boolean; // Flag to determine if the entity is visible on Desktop
  showOnMobile: boolean; // Flag to determine if the entity is visible on Mobile
};

class VisiblePerPlatform extends hz.Component<Props> {
  // Define the properties for this component
  static propsDefinition = {
    showOnVR: { type: hz.PropTypes.Boolean, default: false }, // Visibility flag for VR
    showOnDesktop: { type: hz.PropTypes.Boolean, default: false }, // Visibility flag for Desktop
    showOnMobile: { type: hz.PropTypes.Boolean, default: false }, // Visibility flag for Mobile
  };

  // Keep track of the players who should be able to see the entity
  private readonly visibleToList = new Set<hz.Player>();

  // Called before the component fully starts
  preStart() {
    this.handlePlayerEntryAndExit(); // Set up handlers for player entering and exiting the world
  }

  // Empty start method that can be overridden if needed
  start() {}

  // Handles setting up the events for player entry and exit
  private handlePlayerEntryAndExit() {
    // Connect to the player entry event
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, this.onPlayerEnter.bind(this));
    // Connect to the player exit event
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, this.onPlayerExit.bind(this));
  }

  // Called when a player enters the world
  private onPlayerEnter(player: hz.Player): void {
    // Check if the player should see the entity based on their platform
    if (this.shouldPlayerSeeEntity(player)) {
      this.visibleToList.add(player); // Add player to the visibility list if they should see the entity
    }
    this.updateVisibility(); // Update entity visibility
  }

  // Called when a player exits the world
  private onPlayerExit(player: hz.Player): void {
    this.visibleToList.delete(player); // Remove player from the visibility list
    this.updateVisibility(); // Update entity visibility
  }

  // Determine if a player should see the entity based on their device type
  private shouldPlayerSeeEntity(player: hz.Player): boolean {
    const deviceType = player.deviceType.get(); // Get the player's device type
    return (
      (this.props.showOnVR && deviceType === hz.PlayerDeviceType.VR) ||
      (this.props.showOnDesktop && deviceType === hz.PlayerDeviceType.Desktop) ||
      (this.props.showOnMobile && deviceType === hz.PlayerDeviceType.Mobile)
    );
  }

  // Update the visibility of the entity based on the current players in the visibility list
  private updateVisibility() {
    if (this.visibleToList.size > 0) {
      // Set the visibility of the entity to be visible only to the players in the list
      this.entity.setVisibilityForPlayers(Array.from(this.visibleToList), hz.PlayerVisibilityMode.VisibleTo);
    } else {
      // If no players should see the entity, set it to be hidden from all players
      this.entity.setVisibilityForPlayers([], hz.PlayerVisibilityMode.HiddenFrom);
    }
  }
}

// Register the component with the framework
hz.Component.register(VisiblePerPlatform);