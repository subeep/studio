import type { Driver, Track } from './types';

export const DRIVERS: Driver[] = [
  { id: 'ver', name: 'Max Verstappen', team: 'Red Bull Racing', color: '#3671C6', tricode: 'VER' },
  { id: 'per', name: 'Sergio Pérez', team: 'Red Bull Racing', color: '#3671C6', tricode: 'PER' },
  { id: 'ham', name: 'Lewis Hamilton', team: 'Mercedes', color: '#6CD3BF', tricode: 'HAM' },
  { id: 'rus', name: 'George Russell', team: 'Mercedes', color: '#6CD3BF', tricode: 'RUS' },
  { id: 'lec', name: 'Charles Leclerc', team: 'Ferrari', color: '#F91536', tricode: 'LEC' },
  { id: 'sai', name: 'Carlos Sainz', team: 'Ferrari', color: '#F91536', tricode: 'SAI' },
  { id: 'nor', name: 'Lando Norris', team: 'McLaren', color: '#F58020', tricode: 'NOR' },
  { id: 'pia', name: 'Oscar Piastri', team: 'McLaren', color: '#F58020', tricode: 'PIA' },
  { id: 'alo', name: 'Fernando Alonso', team: 'Aston Martin', color: '#358C75', tricode: 'ALO' },
  { id: 'str', name: 'Lance Stroll', team: 'Aston Martin', color: '#358C75', tricode: 'STR' },
  { id: 'oco', name: 'Esteban Ocon', team: 'Alpine', color: '#2293D1', tricode: 'OCO' },
  { id: 'gas', name: 'Pierre Gasly', team: 'Alpine', color: '#2293D1', tricode: 'GAS' },
  { id: 'alb', name: 'Alexander Albon', team: 'Williams', color: '#37BEDD', tricode: 'ALB' },
  { id: 'sar', name: 'Logan Sargeant', team: 'Williams', color: '#37BEDD', tricode: 'SAR' },
  { id: 'tsu', name: 'Yuki Tsunoda', team: 'RB', color: '#6692FF', tricode: 'TSU' },
  { id: 'ric', name: 'Daniel Ricciardo', team: 'RB', color: '#6692FF', tricode: 'RIC' },
  { id: 'bot', name: 'Valtteri Bottas', team: 'Sauber', color: '#52E252', tricode: 'BOT' },
  { id: 'zho', name: 'Guanyu Zhou', team: 'Sauber', color: '#52E252', tricode: 'ZHO' },
  { id: 'mag', name: 'Kevin Magnussen', team: 'Haas', color: '#B6BABD', tricode: 'MAG' },
  { id: 'hul', name: 'Nico Hülkenberg', team: 'Haas', color: '#B6BABD', tricode: 'HUL' },
];

export const RACE_TRACK: Track = {
  name: 'Circuit de la Vision',
  path: 'M 100,200 A 80,80 0 0 1 180,120 L 420,120 A 80,80 0 0 1 500,200 L 500,300 A 80,80 0 0 1 420,380 L 180,380 A 80,80 0 0 1 100,300 Z',
  length: 1570,
  drsZones: [
    { start: 0.1, end: 0.35 },
    { start: 0.6, end: 0.85 },
  ],
};

export const TOTAL_LAPS = 50;
