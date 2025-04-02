import * as hz from 'horizon/core';
import { GameState, Pool } from 'GameUtils';
import { Events } from "Events";

/**
 * EnvironmentalSoundManager class manages background music and voice-overs (VO) for different game states.
 * This class ensures that the correct background audio is played depending on the game state, and handles countdown and other voice-over prompts.
 */
export class EnvironmentalSoundManager extends hz.Component<typeof EnvironmentalSoundManager> {
  // Define properties for the different audio tracks used in the game
  static propsDefinition = {
    LobbyBGAudio: { type: hz.PropTypes.Entity }, // Background audio for the lobby
    LobbyReadyUpBGAudio: { type: hz.PropTypes.Entity }, // Background audio for the ready-up phase
    RaceBGAudio: { type: hz.PropTypes.Entity }, // Background audio for the race
    countdown10VO: { type: hz.PropTypes.Entity }, // Voice-over for 10 seconds countdown
    countdown3VO: { type: hz.PropTypes.Entity }, // Voice-over for 3 seconds countdown
    countdown2VO: { type: hz.PropTypes.Entity }, // Voice-over for 2 seconds countdown
    countdown1VO: { type: hz.PropTypes.Entity }, // Voice-over for 1 second countdown
    matchStartedVO: { type: hz.PropTypes.Entity }, // Voice-over when the match starts
    matchEndingVO: { type: hz.PropTypes.Entity }, // Voice-over when the match is ending
    matchEndedVO: { type: hz.PropTypes.Entity }, // Voice-over when the match ends
  };

  private static s_instance: EnvironmentalSoundManager;
  public static getInstance(): EnvironmentalSoundManager {
    return EnvironmentalSoundManager.s_instance;
  }

  // Constructor to ensure only one instance of EnvironmentalSoundManager exists
  constructor() {
    super();
    if (EnvironmentalSoundManager.s_instance === undefined) {
      EnvironmentalSoundManager.s_instance = this;
    } else {
      console.error(`There are two ${this.constructor.name} in the world!`);
      return;
    }
  }

  // Options for background and voice-over audio playback
  private readonly BGMAudioOptions: hz.AudioOptions = { fade: 2 }; // Background music fades over 2 seconds
  private readonly VOAudioOptions: hz.AudioOptions = { fade: 0 }; // Voice-over plays without fading
  private audioMap = new Map<string, hz.AudioGizmo | null>(); // Map to store audio gizmos for easy access

  // Called before the component fully starts
  preStart() {
    this.initAudioEntities(); // Initialize audio entities and store them in the audio map

    // Start playing the lobby background audio by default
    this.manageBackgroundAudio(this.props.LobbyBGAudio);

    // Connect events to handle game state changes and countdowns
    this.connectLocalBroadcastEvent(Events.onGameStateChanged, (data) => {
      this.handleGameStateChange(data.fromState, data.toState);
    });

    this.connectLocalBroadcastEvent(Events.onGameStartTimeLeft, (data) => {
      this.playCountdownAudio(data.timeLeftMS);
    });

    this.connectLocalBroadcastEvent(Events.onGameEndTimeLeft, (data) => {
      this.playCountdownAudio(data.timeLeftMS);
    });
  }

  // Empty start method that can be overridden if necessary
  start() {}

  // Initialize audio entities by storing them in a map for easier access
  private initAudioEntities() {
    this.audioMap.set('LobbyBGAudio', this.props.LobbyBGAudio?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('LobbyReadyUpBGAudio', this.props.LobbyReadyUpBGAudio?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('RaceBGAudio', this.props.RaceBGAudio?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('countdown10VO', this.props.countdown10VO?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('countdown3VO', this.props.countdown3VO?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('countdown2VO', this.props.countdown2VO?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('countdown1VO', this.props.countdown1VO?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('matchStartedVO', this.props.matchStartedVO?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('matchEndingVO', this.props.matchEndingVO?.as(hz.AudioGizmo) ?? null);
    this.audioMap.set('matchEndedVO', this.props.matchEndedVO?.as(hz.AudioGizmo) ?? null);
  }

  // Handle game state changes and play corresponding audio
  private handleGameStateChange(fromState: GameState, toState: GameState) {
    switch (toState) {
      case GameState.StartingMatch:
        this.manageBackgroundAudio(this.props.LobbyReadyUpBGAudio); // Play ready-up music
        this.playVoiceOver('matchStartedVO'); // Play match started voice-over
        break;
      case GameState.PlayingMatch:
        this.manageBackgroundAudio(this.props.RaceBGAudio); // Play race background music
        break;
      case GameState.ReadyForMatch:
        this.manageBackgroundAudio(this.props.LobbyBGAudio); // Play lobby background music
        break;
      case GameState.EndingMatch:
        this.playVoiceOver('matchEndingVO'); // Play match ending voice-over
        break;
      case GameState.CompletedMatch:
        this.playVoiceOver('matchEndedVO'); // Play match ended voice-over
        break;
    }
  }

  // Play countdown audio based on the time left
  private playCountdownAudio(timeLeftMS: number) {
    if (timeLeftMS <= 3500 && timeLeftMS > 2500) {
      this.playVoiceOver('countdown3VO'); // Play 3-second countdown voice-over
    } else if (timeLeftMS <= 2500 && timeLeftMS > 1500) {
      this.playVoiceOver('countdown2VO'); // Play 2-second countdown voice-over
    } else if (timeLeftMS <= 1500) {
      this.playVoiceOver('countdown1VO'); // Play 1-second countdown voice-over
    } else if (timeLeftMS <= 10500 && timeLeftMS > 9500) {
      this.playVoiceOver('countdown10VO'); // Play 10-second countdown voice-over
    }
  }

  // Manage background audio by stopping others and playing the target audio
  private manageBackgroundAudio(targetAudio: hz.Entity | undefined) {
    const audioEntities = ['LobbyBGAudio', 'LobbyReadyUpBGAudio', 'RaceBGAudio'];

    // Stop other background audios and play the target audio
    for (const audioKey of audioEntities) {
      const audioGizmo = this.audioMap.get(audioKey);
      if (audioGizmo && targetAudio?.as(hz.AudioGizmo) !== audioGizmo) {
        audioGizmo.stop(this.BGMAudioOptions); // Stop non-target background audio with fade-out
      }
    }

    targetAudio?.as(hz.AudioGizmo)?.play(this.BGMAudioOptions); // Play target audio with fade-in
  }

  // Play the specified voice-over audio
  private playVoiceOver(key: string) {
    this.audioMap.get(key)?.play(this.VOAudioOptions); // Play the voice-over without fade
  }
}

// Register the component with the framework
hz.Component.register(EnvironmentalSoundManager);
