/**
 * Base class that provides functionality for firing events when players or entities enter or exit triggers.
 * This serves as a foundation for other components that need to handle trigger events involving players or entities.
 */
import * as hz from 'horizon/core';

export abstract class PlayerFireEventOnTriggerBase<TProps> extends hz.Component<TProps> {
  // Event subscriptions for entering and exiting triggers
  private onEntityEnterTriggerEvent: hz.EventSubscription | null = null;
  private onEntityExitTriggerEvent: hz.EventSubscription | null = null;
  private onPlayerEnterTriggerEvent: hz.EventSubscription | null = null;
  private onPlayerExitTriggerEvent: hz.EventSubscription | null = null;

  // Called before the component starts
  preStart() {
    // Connect the entity to trigger events for entering and exiting
    this.onEntityEnterTriggerEvent = this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnEntityEnterTrigger,
      this.onEntityEnterTrigger.bind(this)
    ); // Register the callback for when an entity enters the trigger

    this.onEntityExitTriggerEvent = this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnEntityExitTrigger,
      this.onEntityExitTrigger.bind(this)
    ); // Register the callback for when an entity exits the trigger

    this.onPlayerEnterTriggerEvent = this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnterTrigger.bind(this)
    ); // Register the callback for when a player enters the trigger

    this.onPlayerExitTriggerEvent = this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitTrigger,
      this.onPlayerExitTrigger.bind(this)
    ); // Register the callback for when a player exits the trigger
  }

  // Start method that can be overridden by derived classes
  start() { }

  // Called to dispose of the component and clean up any event subscriptions
  dispose() {
    // Disconnect all event subscriptions to avoid memory leaks
    this.onEntityEnterTriggerEvent?.disconnect();
    this.onEntityEnterTriggerEvent = null;

    this.onEntityExitTriggerEvent?.disconnect();
    this.onEntityExitTriggerEvent = null;

    this.onPlayerEnterTriggerEvent?.disconnect();
    this.onPlayerEnterTriggerEvent = null;

    this.onPlayerExitTriggerEvent?.disconnect();
    this.onPlayerExitTriggerEvent = null;
  }

  // Abstract methods to be implemented by subclasses to handle trigger events
  // Called when an entity enters the trigger
  protected abstract onEntityEnterTrigger(enteredBy: hz.Entity): void;

  // Called when an entity exits the trigger
  protected abstract onEntityExitTrigger(exitedBy: hz.Entity): void;

  // Called when a player enters the trigger
  protected abstract onPlayerEnterTrigger(enteredBy: hz.Player): void;

  // Called when a player exits the trigger
  protected abstract onPlayerExitTrigger(exitedBy: hz.Player): void;
}
