export interface Driver {
  id: string;
  name: string;
  team: string;
  color: string;
  tricode: string;
}

export interface Car {
  driver: Driver;
  position: number;
  lap: number;
  progress: number; // 0 to 100, percentage of lap completion
  speed: number; // in km/h
  tire: 'Soft' | 'Medium' | 'Hard' | 'Intermediate' | 'Wet';
  tireWear: number; // 0 to 100
  tireQuality: 'New' | 'Used';
  isPitting: boolean;
  pitStops: number;
  highlight: boolean;
  totalDistance: number; // in meters
}

export type Weather = 'Dry' | 'Light Rain' | 'Heavy Rain';

export interface Track {
  name: string;
  path: string;
  pitLanePath: string;
  length: number; // in meters
  drsZones: { start: number; end: number }[];
}

export interface RaceState {
  lap: number;
  totalLaps: number;
  weather: Weather;
  cars: Car[];
  track: Track;
  isFinished?: boolean;
}

export type RaceEvent =
  | { type: 'OVERTAKE'; payload: { overtakingCarId: string; overtakenCarId: string } }
  | { type: 'PIT_STOP_START'; payload: { driverId: string } }
  | { type: 'PIT_STOP_END'; payload: { driverId: string } }
  | { type: 'WEATHER_CHANGE'; payload: { newWeather: Weather } }
  | { type: 'RACE_START' }
  | { type: 'RACE_FINISH' };
