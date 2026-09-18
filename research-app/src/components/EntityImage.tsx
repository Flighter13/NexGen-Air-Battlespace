import { useState } from 'react';
import type { Entity } from '../data/schema';
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export function EntityImage({
  entity,
  small = false,
}: {
  entity: Entity;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!entity.media || failed)
    return (
      <span
        className={small ? 'mini-symbol' : 'entity-symbol'}
        aria-label={`${entity.name} image unavailable`}
      >
        ✧
      </span>
    );
  return (
    <img
      className={small ? 'entity-thumb' : 'entity-image'}
      src={assetUrl(entity.media.src)}
      alt={small ? '' : entity.media.alt}
      onError={() => setFailed(true)}
    />
  );
}
