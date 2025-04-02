import { Quaternion, Vec3 } from "horizon/core";

// Conversion constants
export const Deg2Rad = Math.PI / 180; // Multiply by this to convert degrees to radians
export const Rad2Deg = 180 / Math.PI; // Multiply by this to convert radians to degrees

/**
 * Function to get the acute angle between two vectors.
 * Uses the dot product formula to calculate the angle between two vectors.
 * 
 * @param {Vec3} v1 - The first vector.
 * @param {Vec3} v2 - The second vector.
 * @returns {number} - The acute angle between v1 and v2 in radians.
 */
export function acuteAngleBetweenVecs(v1: Vec3, v2: Vec3): number {
  const dotProduct = v1.dot(v2) / (v1.magnitude() * v2.magnitude());
  return Math.acos(Math.min(Math.max(dotProduct, -1), 1)); // Clamp value to valid range for acos
}

/**
 * Function to get the clockwise angle between two vectors in the XZ plane (2D).
 * Uses the determinant and dot product to calculate the angle between two vectors.
 * The angle is returned in radians and is always between 0 and 2 * PI.
 * 
 * @param {Vec3} v1 - The first vector.
 * @param {Vec3} v2 - The second vector.
 * @returns {number} - The clockwise angle between v1 and v2 in radians.
 */
export function getClockwiseAngle(v1: Vec3, v2: Vec3): number {
  const dot = v1.x * v2.x + v1.z * v2.z; // Dot product (ignoring Y-axis)
  const det = v1.x * v2.z - v1.z * v2.x; // Determinant (ignoring Y-axis)
  return (Math.atan2(det, dot) + 2 * Math.PI) % (2 * Math.PI); // Ensure angle is between 0 and 2 * PI
}

/**
 * Function to get the forward direction from a quaternion rotation.
 * Multiplies a quaternion by a forward-facing vector to determine the direction.
 * 
 * @param {Quaternion} rotation - The quaternion rotation.
 * @returns {Vec3} - The forward direction vector.
 */
export function getForward(rotation: Quaternion): Vec3 {
  return Quaternion.mulVec3(rotation, Vec3.forward).normalize();
}
