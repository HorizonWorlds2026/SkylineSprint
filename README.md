# Skyline Sprint

Welcome to **Skyline Sprint**, an exhilarating virtual experience crafted for Meta Horizon Worlds. This repository contains the core scripts that drive the dynamic and immersive gameplay of the Skyline Sprint world.

## Overview

Skyline Sprint is designed to offer players a high-speed adventure through a futuristic cityscape. Participants navigate through intricate courses, leveraging power-ups and avoiding obstacles to achieve the fastest times. The scripts in this repository manage various aspects of the game, ensuring a seamless and engaging experience.

## Features

- **Device Visibility Management**: Optimizes object visibility based on player proximity and device capabilities, enhancing performance and immersion.
- **Environmental Sound Management**: Controls ambient sounds and audio cues to create a rich auditory environment.
- **Game Management**: Oversees game state transitions, player progress tracking, and overall game flow.
- **Gravity Grid System**: Implements dynamic gravity zones that influence player movement and add complexity to the courses.
- **HUD Management**: Manages the in-game Heads-Up Display, providing players with real-time information and feedback.
- **Leaderboard Integration**: Tracks and displays player rankings, fostering competition and replayability.
- **Match Management**: Coordinates multiplayer sessions, ensuring synchronized gameplay experiences.
- **Player Controllers**: Handles player inputs, movements, and interactions within the game world.
- **Out-of-Bounds Management**: Detects and responds to players leaving the designated play area, maintaining game integrity.
- **Power-Up Systems**: Implements collectible items that grant temporary abilities or advantages to players.

## Script Details

- **DeviceVisibilityManager.ts**: Manages the visibility of objects based on device performance and player location.
- **EnvironmentalSoundManager.ts**: Controls environmental audio elements to enhance immersion.
- **Events.ts**: Defines custom events used throughout the game for communication between systems.
- **GameManager.ts**: Oversees the main game loop and state transitions.
- **GameUtils.ts**: Provides utility functions to support various game mechanics.
- **GravityGridScript.ts**: Implements the gravity grid system affecting player movement.
- **HUDLocal.ts**: Manages local HUD elements specific to individual players.
- **HUDManager.ts**: Coordinates the overall HUD display and updates.
- **HideTeachingObjects.ts**: Handles the visibility of tutorial or instructional objects.
- **InitialPlayerSettings.ts**: Sets up initial parameters and settings for players upon game entry.
- **LeaderboardController.ts**: Interfaces with the leaderboard system to update and retrieve player rankings.
- **LeaderboardManager.ts**: Manages the storage and display of leaderboard data.
- **MatchManager.ts**: Coordinates multiplayer match sessions and player matchmaking.
- **MathUtils.ts**: Offers mathematical utility functions for calculations used in-game.
- **ObjectReturnTP.ts**: Handles the return of objects to their original positions after being moved or used.
- **PlayerBoostPowerUpTrigger.ts**: Manages the activation and effects of speed boost power-ups.
- **PlayerControllerLocal.ts**: Handles player input and movement on a local level.
- **PlayerControllerManager.ts**: Oversees multiple player controllers and ensures synchronized behavior.
- **PlayerEventTriggerBase.ts**: Serves as a base class for triggers that respond to player events.
- **PlayerOOBManager.ts**: Manages scenarios where players move out of bounds, enforcing game rules.
- **PlayerOOBRespawner.ts**: Handles respawning players who have left the designated play area.
- **PlayerOOBTrigger.ts**: Detects when players cross out-of-bounds thresholds.
- **PlayerRegisterMatchTrigger.ts**: Manages player registration for matches and initiates game sessions.

## Getting Started

To integrate or modify the Skyline Sprint scripts:

1. **Clone the Repository**: Begin by cloning this repository to your local development environment.
2. **Explore the Scripts**: Familiarize yourself with the scripts listed above to understand their functionalities and interconnections.
3. **Customize for Your World**: Modify the scripts as needed to tailor the Skyline Sprint experience to your specific requirements within Meta Horizon Worlds.
4. **Test Thoroughly**: Ensure all changes are tested in a controlled environment to maintain game stability and performance.

## Contributing

We welcome contributions to enhance the Skyline Sprint experience. To contribute:

1. **Fork the Repository**: Create a personal fork of this repository.
2. **Create a Feature Branch**: Develop your feature or fix in a dedicated branch.
3. **Submit a Pull Request**: Once your changes are complete and tested, submit a pull request for review.

## Acknowledgments

Special thanks to the Meta Horizon Worlds community and developers for their support and collaboration in bringing Skyline Sprint to life.
