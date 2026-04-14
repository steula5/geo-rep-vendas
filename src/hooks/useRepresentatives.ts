import { useState, useEffect, useCallback } from 'react';
import { Representative, Region, REPRESENTATIVE_COLORS } from '@/types/representative';

const STORAGE_KEY = 'representatives-data';

function loadData(): Representative[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveData(data: Representative[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useRepresentatives() {
  const [representatives, setRepresentatives] = useState<Representative[]>(loadData);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    saveData(representatives);
  }, [representatives]);

  const getNextColor = useCallback(() => {
    const usedColors = representatives.map(r => r.color);
    return REPRESENTATIVE_COLORS.find(c => !usedColors.includes(c)) || REPRESENTATIVE_COLORS[representatives.length % REPRESENTATIVE_COLORS.length];
  }, [representatives]);

  const addRepresentative = useCallback((data: Omit<Representative, 'id' | 'regions' | 'pins'>) => {
    const rep: Representative = {
      ...data,
      id: crypto.randomUUID(),
      color: data.color || getNextColor(),
      regions: [],
      pins: [],
    };
    setRepresentatives(prev => [...prev, rep]);
    return rep;
  }, [getNextColor]);

  const updateRepresentative = useCallback((id: string, data: Partial<Representative>) => {
    setRepresentatives(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  }, []);

  const deleteRepresentative = useCallback((id: string) => {
    setRepresentatives(prev => prev.filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const addRegion = useCallback((repId: string, region: Region) => {
    setRepresentatives(prev => prev.map(r =>
      r.id === repId ? { ...r, regions: [...r.regions, region] } : r
    ));
  }, []);

  const deleteRegion = useCallback((repId: string, regionId: string) => {
    setRepresentatives(prev => prev.map(r =>
      r.id === repId ? { ...r, regions: r.regions.filter(reg => reg.id !== regionId) } : r
    ));
  }, []);

  const addPin = useCallback((repId: string, pin: import('@/types/representative').Pin) => {
    setRepresentatives(prev => prev.map(r =>
      r.id === repId ? { ...r, pins: [...(r.pins || []), pin] } : r
    ));
  }, []);

  const deletePin = useCallback((repId: string, pinId: string) => {
    setRepresentatives(prev => prev.map(r =>
      r.id === repId ? { ...r, pins: (r.pins || []).filter(p => p.id !== pinId) } : r
    ));
  }, []);

  const findRepresentativeByPoint = useCallback((lat: number, lng: number): Representative | null => {
    // Simple point-in-polygon check
    for (const rep of representatives) {
      for (const region of rep.regions) {
        if (isPointInPolygon(lat, lng, region.points as [number, number][])) {
          return rep;
        }
      }
    }
    return null;
  }, [representatives]);

  const selected = representatives.find(r => r.id === selectedId) || null;

  return {
    representatives,
    selected,
    selectedId,
    setSelectedId,
    setRepresentatives,
    addRepresentative,
    updateRepresentative,
    deleteRepresentative,
    addRegion,
    deleteRegion,
    addPin,
    deletePin,
    findRepresentativeByPoint,
  };
}

function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
