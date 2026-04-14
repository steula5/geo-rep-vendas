import { LatLngExpression } from 'leaflet';

export interface Representative {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  states: string[];
  notes: string;
  salesGoal?: number;
  color: string;
  regions: Region[];
  pins?: Pin[];
  cityBounds?: CityBound[];
}

export interface Pin {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface CityBound {
  id: string;
  name: string;
  state: string;
}

export interface Region {
  id: string;
  points: LatLngExpression[];
}

export const REPRESENTATIVE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
