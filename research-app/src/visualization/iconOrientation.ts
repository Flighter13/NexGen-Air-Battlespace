import type { Entity } from '../data/schema';

export type IconCalibration = {
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  // Clockwise degrees from image-up to the nose, before any rotation.
  noseHeading: number;
};

export const defaultIconCalibration: IconCalibration = {
  width: 160,
  height: 170,
  anchorX: 80,
  anchorY: 85,
  noseHeading: 0,
};

// All three original schematic assets are 160 x 170, with a vertical
// tail-to-nose axis at x=80. The fuselage pivot is (80,85).
const calibratedIcons: Record<string, IconCalibration> = {
  'assets/entities/fighter.svg': defaultIconCalibration,
  'assets/entities/uncrewed.svg': defaultIconCalibration,
  'assets/entities/support.svg': defaultIconCalibration,
};

export function iconCalibration(media?: Entity['media']): IconCalibration {
  return (
    media?.iconCalibration ??
    calibratedIcons[media?.icon ?? 'assets/entities/uncrewed.svg'] ??
    defaultIconCalibration
  );
}

export function iconAngle(heading: number, noseHeading = 0, headingOffset = 0) {
  // deck.gl IconLayer is counterclockwise; compass/image bearings are clockwise.
  // headingOffset remains an optional clockwise correction to the desired heading.
  return (((noseHeading - heading - headingOffset) % 360) + 360) % 360;
}
