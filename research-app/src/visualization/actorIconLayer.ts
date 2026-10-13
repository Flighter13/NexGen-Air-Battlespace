import { IconLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { Snapshot } from '../engine/timeline';
import { assetUrl } from '../components/EntityImage';
import { iconAngle, iconCalibration } from './iconOrientation';

type Actor = Snapshot['actors'][number];

export function actorIconLayer(
  actors: Actor[],
  onSelect: (id: string) => void,
) {
  return new IconLayer<Actor>({
    id: 'actors',
    data: actors,
    getPosition: (a) => a.position,
    getIcon: (a) => {
      const { width, height, anchorX, anchorY } = iconCalibration(
        a.entity.media,
      );
      return {
        url: assetUrl(a.entity.media?.icon ?? 'assets/entities/uncrewed.svg'),
        width,
        height,
        anchorX,
        anchorY,
      };
    },
    getSize: 29,
    // Rotate in the map plane, so bearing and pitch affect the path and icon alike.
    billboard: false,
    getAngle: (a) =>
      iconAngle(
        a.heading,
        iconCalibration(a.entity.media).noseHeading,
        a.entity.media?.headingOffset,
      ),
    pickable: true,
    onClick: (info: PickingInfo<Actor>) => {
      if (info.object) onSelect(info.object.id);
    },
  });
}
