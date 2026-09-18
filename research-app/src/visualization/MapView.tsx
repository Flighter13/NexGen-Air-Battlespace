import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import {
  IconLayer,
  LineLayer,
  PathLayer,
  ScatterplotLayer,
  TextLayer,
} from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import { catalog } from '../data/catalog';
import { offsetPosition, type Snapshot } from '../engine/timeline';
import { assetUrl } from '../components/EntityImage';
import 'maplibre-gl/dist/maplibre-gl.css';
type Actor = Snapshot['actors'][number];
export function MapView({
  state,
  selected,
  onSelect,
}: {
  state: Snapshot;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    overlay = useRef<MapboxOverlay | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const initialActors = useRef(state.actors);
  useEffect(() => {
    let map: maplibregl.Map | undefined;
    try {
      const coordinates = initialActors.current.flatMap((a) =>
        a.keyframes.map(
          (k) =>
            catalog.locations.find((l) => l.id === k.locationId)!.coordinates,
        ),
      );
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((p) => bounds.extend(p));
      const sw = bounds.getSouthWest(),
        ne = bounds.getNorthEast();
      bounds.extend([sw.lng - 4, sw.lat - 3]);
      bounds.extend([ne.lng + 4, ne.lat + 5]);
      map = new maplibregl.Map({
        container: container.current!,
        style: {
          version: 8,
          sources: {
            land: {
              type: 'geojson',
              data: assetUrl('assets/maps/land.geojson'),
              attribution:
                '<a href="https://www.naturalearthdata.com/">Natural Earth</a> · public domain',
            },
          },
          layers: [
            {
              id: 'ocean',
              type: 'background',
              paint: { 'background-color': '#122e40' },
            },
            {
              id: 'land',
              type: 'fill',
              source: 'land',
              paint: { 'fill-color': '#2b404a' },
            },
            {
              id: 'coast',
              type: 'line',
              source: 'land',
              paint: { 'line-color': '#536974', 'line-width': 1 },
            },
          ],
        },
        bounds,
        fitBoundsOptions: { padding: 55, maxZoom: 5 },
        attributionControl: { compact: true },
      });
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right',
      );
      overlay.current = new MapboxOverlay({ interleaved: false, layers: [] });
      map.addControl(overlay.current);
      map.on('error', () =>
        setError(
          'The bundled basemap could not load. You can still explore the Network view.',
        ),
      );
      setReady(true);
      const observer = new ResizeObserver(() => map?.resize());
      observer.observe(container.current!);
      return () => {
        observer.disconnect();
        overlay.current = null;
        map?.remove();
      };
    } catch {
      setError(
        'Geographic rendering needs WebGL. Use the Network view on this device.',
      );
      map?.remove();
    }
  }, []);
  useEffect(() => {
    if (!ready || !overlay.current) return;
    const links = state.relationships.map((r) => ({
      ...r,
      source: state.actors.find((a) => a.id === r.from)!.position,
      target: state.actors.find((a) => a.id === r.to)!.position,
    }));
    const locationIds = new Set(
      state.actors.flatMap((a) => a.keyframes.map((k) => k.locationId)),
    );
    const locations = catalog.locations.filter((l) => locationIds.has(l.id));
    overlay.current.setProps({
      layers: [
        new PathLayer<Actor>({
          id: 'routes',
          data: state.actors,
          getPath: (a) =>
            a.keyframes.map((k) =>
              offsetPosition(
                catalog.locations.find((l) => l.id === k.locationId)!
                  .coordinates,
                a.offsetKm,
              ),
            ),
          getColor: [99, 153, 173, 90],
          getWidth: 1,
          widthUnits: 'pixels',
        }),
        new ScatterplotLayer({
          id: 'sites',
          data: locations,
          getPosition: (l) => l.coordinates,
          getRadius: 4,
          radiusUnits: 'pixels',
          getFillColor: [151, 170, 184],
        }),
        new TextLayer({
          id: 'site-labels',
          data: locations,
          getPosition: (l) => l.coordinates,
          getText: (l) => l.name,
          getSize: 11,
          getColor: [167, 184, 196],
          getPixelOffset: [0, 20],
        }),
        new LineLayer({
          id: 'relationships',
          data: links,
          getSourcePosition: (r) => r.source,
          getTargetPosition: (r) => r.target,
          getColor: [230, 186, 120],
          getWidth: 3,
          pickable: true,
        }),
        new ScatterplotLayer<Actor>({
          id: 'selection',
          data: state.actors.filter((a) => a.id === selected),
          getPosition: (a) => a.position,
          getRadius: 24,
          radiusUnits: 'pixels',
          getFillColor: [104, 222, 210, 45],
          stroked: true,
          getLineColor: [104, 222, 210, 180],
          getLineWidth: 1,
          lineWidthUnits: 'pixels',
        }),
        new IconLayer<Actor>({
          id: 'actors',
          data: state.actors,
          getPosition: (a) => a.position,
          getIcon: (a) => ({
            url: assetUrl(
              a.entity.media?.icon ?? 'assets/entities/uncrewed.svg',
            ),
            width: 160,
            height: 170,
            anchorY: 85,
          }),
          getSize: 29,
          pickable: true,
          onClick: (info: PickingInfo<Actor>) => {
            if (info.object) onSelect(info.object.id);
          },
        }),
        new TextLayer<Actor>({
          id: 'actor-labels',
          data: state.actors.filter(
            (a) => a.offsetKm[0] === 0 || a.id === selected,
          ),
          getPosition: (a) => a.position,
          getText: (a) => a.label,
          getSize: 12,
          getColor: [239, 245, 248],
          getPixelOffset: [0, -23],
          background: true,
          getBackgroundColor: [16, 28, 40, 210],
        }),
      ],
      getTooltip: (info) =>
        info.object
          ? {
              text: info.object.label ?? '',
              style: { backgroundColor: '#172b38', color: '#fff' },
            }
          : null,
    });
  }, [state, ready, selected, onSelect]);
  return (
    <>
      <div
        className="map"
        ref={container}
        aria-label="Illustrative geographic scenario map"
      />
      {error && (
        <div role="status" className="map-error">
          {error}
        </div>
      )}
    </>
  );
}
