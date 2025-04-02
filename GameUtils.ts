/**
 * This script defines game-wide enums, utility functions, and classes for game management.
 * It includes advanced curve functions for visualizing complex paths using interpolation.
 * Additionally, it provides utility functions for managing game states, player status, object pools, and visualizing curve paths.
 */

import * as hz from "horizon/core";

// Enumeration representing different game states
export enum GameState {
  "ReadyForMatch",    // Default state: nothing is happening, ready to start a match
  "StartingMatch",    // Players have started a match
  "PlayingMatch",     // A match is currently ongoing
  "EndingMatch",      // The match is ending
  "CompletedMatch",   // The match has just completed
}

// Enumeration representing the status of a player during a match
export enum PlayerGameStatus {
  "Lobby",       // Player is in the lobby
  "Standby",     // Player is on standby, ready to play
  "Playing",     // Player is actively playing
}

// A generic Pool class to manage available and active objects
export class Pool<T> {
  all: T[] = [];         // All items in the pool
  available: T[] = [];   // Items available for use
  active: T[] = [];      // Currently active items

  // Check if there are available items in the pool
  hasAvailable(): boolean {
    return this.available.length > 0;
  }

  // Check if there are active items in the pool
  hasActive(): boolean {
    return this.active.length > 0;
  }

  // Check if a specific item is available
  isAvailable(t: T): boolean {
    return this.available.includes(t);
  }

  // Get the next available item from the pool
  getNextAvailable(): T | null {
    if (this.hasAvailable()) {
      const available = this.available.shift()!;
      if (!this.active.includes(available)) {
        this.active.push(available);
      }
      return available;
    } else {
      return null;
    }
  }

  // Get a random available item from the pool
  getRandomAvailable(): T | null {
    if (this.hasAvailable()) {
      const rand = Math.floor(Math.random() * this.available.length);
      const available = this.available.splice(rand, 1)[0]!;
      if (!this.active.includes(available)) {
        this.active.push(available);
      }
      return available;
    } else {
      return null;
    }
  }

  // Get a random active item from the pool
  getRandomActive(): T | null {
    if (this.hasActive()) {
      const rand = Math.floor(Math.random() * this.active.length);
      const active = this.active.splice(rand, 1)[0]!;
      return active;
    } else {
      return null;
    }
  }

  // Add an item to the pool
  addToPool(t: T): void {
    if (!this.all.includes(t)) {
      this.all.push(t);
    }
    if (!this.available.includes(t)) {
      this.available.push(t);
    }
    if (this.active.includes(t)) {
      this.active.splice(this.active.indexOf(t), 1);
    }
  }

  // Remove an item from the pool
  removeFromPool(t: T): void {
    if (this.active.includes(t)) {
      this.active.splice(this.active.indexOf(t), 1);
    }
    if (this.available.includes(t)) {
      this.available.splice(this.available.indexOf(t), 1);
    }
    if (this.all.includes(t)) {
      this.all.splice(this.all.indexOf(t), 1);
    }
  }

  // Reset all items to be available
  resetAvailability(): void {
    this.available = this.all.slice();
  }
}

// Convert milliseconds to a formatted time string (minutes:seconds:milliseconds)
export function msToMinutesAndSeconds(time: number): string {
  const baseTime = Math.floor(time);
  let minutes = Math.floor(baseTime / 60);
  let seconds = baseTime % 60;
  let ms = time % 1;
  seconds = seconds === 60 ? 0 : seconds;
  return `${(minutes < 10 ? '0' : '') + minutes} : ${(seconds < 10 ? '0' : '') + seconds.toFixed(0)} : ${ms.toFixed(2).substring(2)}`;
}

// Function for setting a timed interval action and ending action
export function timedIntervalActionFunction(
  timerMS: number,
  component: hz.Component,
  onTickAction: (timerMS: number) => void, // Function to be run during the timer tick
  onEndAction: () => void // Function to be run at the end of the timer
): number {
  let timerID = component.async.setInterval(() => {
    if (timerMS > 0) {
      onTickAction(timerMS); // Call the onTick function
      timerMS -= 1000;
    } else {
      if (timerID !== undefined) {
        onEndAction();
        component.async.clearInterval(timerID);
      }
    }
  }, 1000);

  return timerID;
}

// A class representing a curve, used for interpolation and finding points along a path
export class Curve {
  private _controlPoints: hz.Vec3[] = []; // Control points for the curve

  public get controlPoints(): hz.Vec3[] {
    return this._controlPoints;
  }

  private set controlPoints(value: hz.Vec3[]) {
    this._controlPoints = value;
  }

  constructor(controlPoints: hz.Vec3[]) {
    this.controlPoints = controlPoints;
  }

  // Interpolate the curve at a specific point t (0 to 1)
  interpolate(t: number): hz.Vec3 {
    const n = this.controlPoints.length - 1;
    const index = Math.floor(t * n);
    const t0 = index > 0 ? index / n : 0;
    const t1 = (index + 1) / n;
    const tNormalized = (t - t0) / (t1 - t0);

    // Uses Catmull-Rom interpolation to find the point at t
    return this.interpolateCatmullRom(
      this.controlPoints[Math.max(0, index > 1 ? index - 1 : 0)],
      this.controlPoints[index],
      this.controlPoints[Math.min(n, index < n ? index + 1 : this.controlPoints.length - 1)],
      this.controlPoints[Math.min(n, index < n - 1 ? index + 2 : this.controlPoints.length - 1)],
      tNormalized
    );
  }

  // Find the closest point on the curve to a target point
  findClosestPointCurveProgress(target: hz.Vec3): number {
    const f = (t: number) => {
      const point = this.interpolate(t);
      return this.calculateDistance(target, point);
    };
    const tMin = this.goldenSectionSearch(f, 0, 1, 1e-4); // Use Golden Section Search for optimization
    return tMin;
  }

  // Catmull-Rom spline interpolation between four points
  private interpolateCatmullRom(
    p0: hz.Vec3,
    p1: hz.Vec3,
    p2: hz.Vec3,
    p3: hz.Vec3,
    t: number
  ): hz.Vec3 {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 2 * p1.x - 2 * p2.x + (p2.x - p0.x) * 0.5 + (p3.x - p1.x) * 0.5;
    const y = 2 * p1.y - 2 * p2.y + (p2.y - p0.y) * 0.5 + (p3.y - p1.y) * 0.5;
    const z = 2 * p1.z - 2 * p2.z + (p2.z - p0.z) * 0.5 + (p3.z - p1.z) * 0.5;

    return new hz.Vec3(x * t3 + y * t2 + z * t + p1.x, p1.y, p1.z);
  }

  // Golden Section Search for finding the closest point on the curve
  private goldenSectionSearch(
    f: (x: number) => number,
    a: number,
    b: number,
    tol: number
  ): number {
    const gr = 1.6180339887498948482; // Approximation of the golden ratio
    let c = b - (b - a) / gr;
    let d = a + (b - a) / gr;
    while (Math.abs(b - a) > tol) {
      if (f(c) < f(d)) {
        b = d;
        d = c;
        c = b - (b - a) / gr;
      } else {
        a = c;
        c = d;
        d = a + (b - a) / gr;
      }
    }
    return (b + a) / 2;
  }

  // Calculate squared distance between two points (avoids square root for optimization)
  private calculateDistance(point1: hz.Vec3, point2: hz.Vec3): number {
    return point1.sub(point2).magnitudeSquared();
  }
}

// A component to visualize the curve using trail gizmos
export class CurveVisualizer extends hz.Component<typeof CurveVisualizer> {
  static propsDefinition = {
    showPath: { type: hz.PropTypes.Boolean }, // Boolean to show or hide the path
    trailRenderer: { type: hz.PropTypes.Entity }, // Entity for rendering the trail of the curve
  };

  public static SetCurve = new hz.LocalEvent<{ curve: Curve }>("SetCurve");
  public static StartDrawingCurve = new hz.LocalEvent("StartDrawingCurve");
  public static StopDrawingCurve = new hz.LocalEvent("StopDrawingCurve");

  private splineProgress: number = 0; // Progress along the curve, from 0 to 1
  private curve!: Curve; // The curve being visualized
  private showPath: boolean = false; // Flag to determine if the path should be shown

  preStart() {
    this.showPath = this.props.showPath;

    // Connect to events for setting, starting, and stopping the curve visualization
    this.connectLocalBroadcastEvent(
      CurveVisualizer.SetCurve,
      (data) => {
        this.curve = data.curve;
      });

    this.connectLocalBroadcastEvent(
      CurveVisualizer.StartDrawingCurve,
      () => {
        this.showPath = true;
        this.entity.as(hz.TrailGizmo)!.play();
      });

    this.connectLocalBroadcastEvent(
      CurveVisualizer.StopDrawingCurve,
      () => {
        this.showPath = false;
        this.entity.as(hz.TrailGizmo)!.stop();
      });

    // Update event to draw the curve if visualization is enabled
    this.connectLocalBroadcastEvent(
      hz.World.onUpdate,
      (data) => {
        if (this.showPath && this.curve && this.props.trailRenderer) {
          this.splineProgress = this.drawTrackWithProgress(
            this.props.trailRenderer!,
            this.splineProgress,
            data.deltaTime,
            this.curve);
        }
      });
  }

  start() { }

  // Draw the curve based on progress and deltaTime
  private drawTrackWithProgress(trailRenderer: hz.Entity, splineProgress: number, deltaTime: number, curve: Curve) {
    splineProgress = (splineProgress + deltaTime * 0.1) % 1;
    const interpolatedPoint = curve.interpolate(splineProgress);
    trailRenderer.position.set(interpolatedPoint); // Moves the trail to the current point on the curve
    return splineProgress;
  }
}

// Register the CurveVisualizer component
hz.Component.register(CurveVisualizer);
