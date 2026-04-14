import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Representative } from '@/types/representative';
import brazilStatesData from '@/data/brazil-states.json';

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface BrazilMapProps {
  representatives: Representative[];
  selectedId: string | null;
  onSelectRepresentative: (id: string | null) => void;
  onRegionCreated: (repId: string, points: [number, number][]) => void;
  drawingForId: string | null;
  onSearchResult?: { lat: number; lng: number } | null;
  overlayImage?: string | null;
  overlayOpacity?: number;
}

// Minimum distance (in pixels) to snap to the first point and close the polygon
const SNAP_DISTANCE = 15;

export default function BrazilMap({
  representatives,
  selectedId,
  onSelectRepresentative,
  onRegionCreated,
  drawingForId,
  onSearchResult,
  overlayImage,
  overlayOpacity = 0.5,
}: BrazilMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonsRef = useRef<L.LayerGroup>(L.layerGroup());
  const drawingLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const currentPolygonRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const [cityBoundaries, setCityBoundaries] = useState<Record<string, any>>({});
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const onRegionCreatedRef = useRef(onRegionCreated);
  onRegionCreatedRef.current = onRegionCreated;

  // Drawing state refs (to avoid stale closures)
  const drawingPointsRef = useRef<[number, number][]>([]);
  const drawingMarkersRef = useRef<L.CircleMarker[]>([]);
  const drawingPolylineRef = useRef<L.Polyline | null>(null);
  const drawingPreviewLineRef = useRef<L.Polyline | null>(null);
  const drawingForIdRef = useRef<string | null>(null);
  drawingForIdRef.current = drawingForId;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-14.235, -51.9253],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    polygonsRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch missing city boundaries asynchronously
  useEffect(() => {
    const fetchCityBoundaries = async () => {
      const neededCodeIds = new Set<string>();
      representatives.forEach(rep => {
        if (rep.cityBounds) {
          rep.cityBounds.forEach(city => {
            if (!cityBoundaries[city.id]) {
              neededCodeIds.add(city.id);
            }
          });
        }
      });

      if (neededCodeIds.size === 0) return;

      const newBoundaries = { ...cityBoundaries };
      await Promise.all(Array.from(neededCodeIds).map(async (id) => {
        try {
          const res = await fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${id}?formato=application/vnd.geo+json`);
          const data = await res.json();
          newBoundaries[id] = data;
        } catch (e) {
          console.error('Failed to fetch IBGE boundaries for city', id, e);
        }
      }));

      setCityBoundaries(newBoundaries);
    };

    fetchCityBoundaries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representatives]);

  // Draw polygons for all representatives
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    polygonsRef.current.clearLayers();

    representatives.forEach(rep => {
      // Draw full states from GeoJSON
      if (rep.states && rep.states.length > 0) {
        L.geoJSON(brazilStatesData as any, {
          filter: (feature) => rep.states.includes(feature.properties.sigla),
          style: {
            color: rep.color,
            weight: selectedId === rep.id ? 3 : 2,
            fillColor: rep.color,
            fillOpacity: selectedId === rep.id ? 0.4 : 0.25,
          },
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(`${rep.name} / ${feature.properties.name}`, { direction: 'top' });
            layer.bindPopup(`
              <div style="min-width:180px">
                <strong style="font-size:14px">${feature.properties.name}</strong><br/>
                <span style="color:${rep.color}; font-weight: 500">${rep.name}</span><br/>
                📞 ${rep.phone}<br/>
                ✉️ ${rep.email}
              </div>
            `);
            layer.on('click', () => onSelectRepresentative(rep.id));
          }
        }).addTo(polygonsRef.current);
      }

      // Draw specific city contours from fetched GeoJSON
      if (rep.cityBounds && rep.cityBounds.length > 0) {
        rep.cityBounds.forEach(city => {
          const geoJsonData = cityBoundaries[city.id];
          if (geoJsonData) {
            L.geoJSON(geoJsonData, {
              style: {
                color: rep.color,
                weight: selectedId === rep.id ? 3 : 2,
                fillColor: rep.color,
                fillOpacity: selectedId === rep.id ? 0.4 : 0.25,
              },
              onEachFeature: (_, layer) => {
                layer.bindTooltip(`${rep.name} / ${city.name} - ${city.state}`, { direction: 'top' });
                layer.bindPopup(`
                  <div style="min-width:180px">
                    <strong style="font-size:14px">${city.name} - ${city.state}</strong><br/>
                    <span style="color:${rep.color}; font-weight: 500">${rep.name}</span><br/>
                    📞 ${rep.phone}<br/>
                    ✉️ ${rep.email}
                  </div>
                `);
                layer.on('click', () => onSelectRepresentative(rep.id));
              }
            }).addTo(polygonsRef.current);
          }
        });
      }

      // Draw custom regions
      rep.regions.forEach(region => {
        const polygon = L.polygon(region.points as L.LatLngExpression[], {
          color: rep.color,
          fillColor: rep.color,
          fillOpacity: selectedId === rep.id ? 0.4 : 0.25,
          weight: selectedId === rep.id ? 3 : 2,
        });

        polygon.bindPopup(`
          <div style="min-width:180px">
            <strong style="font-size:14px">${rep.name}</strong><br/>
            <span style="color:#666">${rep.code}</span><br/>
            📞 ${rep.phone}<br/>
            ✉️ ${rep.email}<br/>
            📍 ${rep.states.join(', ')}
          </div>
        `);

        polygon.on('click', () => onSelectRepresentative(rep.id));
        polygon.addTo(polygonsRef.current);
      });

      // Draw pins
      if (rep.pins) {
        rep.pins.forEach(pin => {
          const marker = L.circleMarker([pin.lat, pin.lng], {
            radius: selectedId === rep.id ? 8 : 6,
            color: '#fff',
            weight: 2,
            fillColor: rep.color,
            fillOpacity: 1,
            zIndexOffset: selectedId === rep.id ? 1000 : 0
          });

          marker.bindTooltip(`${rep.name} / ${pin.name}`, {
            permanent: false,
            direction: 'top',
          });

          marker.bindPopup(`
            <div style="min-width:180px">
              <strong style="font-size:14px">${pin.name}</strong><br/>
              <span style="color:${rep.color}; font-weight: 500">${rep.name}</span><br/>
              📞 ${rep.phone}<br/>
              ✉️ ${rep.email}
            </div>
          `);

          marker.on('click', () => onSelectRepresentative(rep.id));
          marker.addTo(polygonsRef.current);
        });
      }
    });
  }, [representatives, selectedId, cityBoundaries, onSelectRepresentative]);

  // Clean up drawing artifacts
  const cleanupDrawing = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove markers
    drawingMarkersRef.current.forEach(m => map.removeLayer(m));
    drawingMarkersRef.current = [];

    // Remove polyline
    if (drawingPolylineRef.current) {
      map.removeLayer(drawingPolylineRef.current);
      drawingPolylineRef.current = null;
    }

    // Remove preview line
    if (drawingPreviewLineRef.current) {
      map.removeLayer(drawingPreviewLineRef.current);
      drawingPreviewLineRef.current = null;
    }

    drawingPointsRef.current = [];
  }, []);

  // Handle clicking on the map to add drawing points
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up previous drawing state
    cleanupDrawing();

    if (!drawingForId) {
      // Restore default cursor
      map.getContainer().style.cursor = '';
      return;
    }

    const rep = representatives.find(r => r.id === drawingForId);
    const color = rep?.color || '#3b82f6';

    // Set drawing cursor
    map.getContainer().style.cursor = 'crosshair';

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!drawingForIdRef.current) return;

      const point: [number, number] = [e.latlng.lat, e.latlng.lng];
      const points = drawingPointsRef.current;

      // Add the point
      points.push(point);

      // Add a marker for this point
      const isFirst = points.length === 1;
      const marker = L.circleMarker(e.latlng, {
        radius: isFirst ? 8 : 5,
        color: isFirst ? '#ffffff' : color,
        fillColor: isFirst ? color : color,
        fillOpacity: 1,
        weight: isFirst ? 3 : 2,
        className: isFirst ? 'first-draw-point' : '',
        interactive: isFirst, // Only the first marker catches mouse events to close
      }).addTo(map);

      if (isFirst) {
        marker.bindTooltip('Clique no 1º ponto para fechar a área', {
          permanent: false,
          direction: 'top',
          className: 'draw-tooltip',
        });
        
        // Handle click on the first point to close the polygon
        marker.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev); // Prevent map click from adding another point
          if (drawingPointsRef.current.length >= 3) {
            onRegionCreatedRef.current(drawingForIdRef.current!, [...drawingPointsRef.current]);
            cleanupDrawing();
          }
        });
      }

      drawingMarkersRef.current.push(marker);

      // Update or create the polyline showing the path
      if (drawingPolylineRef.current) {
        map.removeLayer(drawingPolylineRef.current);
      }
      drawingPolylineRef.current = L.polyline(
        points.map(p => L.latLng(p[0], p[1])),
        {
          color: color,
          weight: 3,
          dashArray: '8, 5',
          opacity: 0.8,
        }
      ).addTo(map);
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const points = drawingPointsRef.current;
      if (points.length === 0) return;

      const lastPoint = points[points.length - 1];

      // Preview line from last point to mouse
      if (drawingPreviewLineRef.current) {
        map.removeLayer(drawingPreviewLineRef.current);
      }

      const previewPoints: L.LatLngExpression[] = [
        L.latLng(lastPoint[0], lastPoint[1]),
        e.latlng,
      ];

      // Check if near first point for snap feedback
      if (points.length >= 3) {
        const firstPoint = points[0];
        const firstPointPx = map.latLngToContainerPoint(L.latLng(firstPoint[0], firstPoint[1]));
        const mousePx = map.latLngToContainerPoint(e.latlng);
        const distance = firstPointPx.distanceTo(mousePx);

        if (distance < SNAP_DISTANCE && drawingMarkersRef.current[0]) {
          drawingMarkersRef.current[0].setStyle({ radius: 12, weight: 4 });
          map.getContainer().style.cursor = 'pointer';
          // Only show the closing line when actively hovering the first point
          previewPoints.push(L.latLng(firstPoint[0], firstPoint[1]));
        } else {
          if (drawingMarkersRef.current[0]) {
            drawingMarkersRef.current[0].setStyle({ radius: 8, weight: 3 });
          }
          map.getContainer().style.cursor = 'crosshair';
        }
      }

      drawingPreviewLineRef.current = L.polyline(previewPoints, {
        color: color,
        weight: 2,
        dashArray: '4, 8',
        opacity: 0.5,
      }).addTo(map);
    };

    // Handle right-click to undo last point
    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();
      const points = drawingPointsRef.current;
      if (points.length === 0) return;

      // Remove last point
      points.pop();

      // Remove last marker
      const lastMarker = drawingMarkersRef.current.pop();
      if (lastMarker) map.removeLayer(lastMarker);

      // Update polyline
      if (drawingPolylineRef.current) {
        map.removeLayer(drawingPolylineRef.current);
        drawingPolylineRef.current = null;
      }
      if (points.length > 0) {
        drawingPolylineRef.current = L.polyline(
          points.map(p => L.latLng(p[0], p[1])),
          {
            color: color,
            weight: 3,
            dashArray: '8, 5',
            opacity: 0.8,
          }
        ).addTo(map);
      }
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);
    map.on('contextmenu', handleContextMenu);

    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMouseMove);
      map.off('contextmenu', handleContextMenu);
      cleanupDrawing();
      map.getContainer().style.cursor = '';
    };
  }, [drawingForId, representatives, cleanupDrawing]);

  // Search result marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    if (onSearchResult) {
      const marker = L.marker([onSearchResult.lat, onSearchResult.lng]).addTo(map);
      searchMarkerRef.current = marker;
      map.setView([onSearchResult.lat, onSearchResult.lng], 10);
    }
  }, [onSearchResult]);

  // Overlay image
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }

    if (overlayImage) {
      const bounds: L.LatLngBoundsExpression = [
        [5.3, -73.99],
        [-33.75, -34.79],
      ];
      const overlay = L.imageOverlay(overlayImage, bounds, {
        opacity: overlayOpacity,
        interactive: false,
      }).addTo(map);
      overlayRef.current = overlay;
    }
  }, [overlayImage, overlayOpacity]);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
