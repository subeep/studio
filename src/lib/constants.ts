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
  path: 'M 50,250 C 50,100 200,50 300,100 S 450,150 550,100 C 650,50 750,150 750,250 S 650,450 550,400 S 400,300 300,350 S 50,400 50,250 Z',
  length: 2200,
  drsZones: [
    { start: 0.15, end: 0.35 },
    { start: 0.55, end: 0.75 },
    { start: 0.85, end: 0.98 },
  ],
};

export const TOTAL_LAPS = 70;
