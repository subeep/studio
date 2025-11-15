'use client';

import { DRIVERS, RACE_TRACK, TOTAL_LAPS } from './constants';
import type { Car, RaceState, RaceEvent, Weather } from './types';

export class RaceSimulation {
  public state: RaceState;
  private pitStopTimers: Map<string, number> = new Map();

  constructor() {
    this.state = this.getInitialRaceState();
  }

  private getInitialRaceState(): RaceState {
    const cars: Car[] = DRIVERS.map((driver, index) => ({
      driver,
      position: index + 1,
      lap: 1,
      progress: 0,
      speed: 180 + Math.random() * 40 - 20,
      tire: 'Medium',
      tireWear: 0,
      isPitting: false,
      pitStops: 0,
      highlight: false,
    }));

    return {
      lap: 1,
      totalLaps: TOTAL_LAPS,
      weather: 'Dry',
      cars,
      track: RACE_TRACK,
    };
  }
  
  tick(): RaceEvent[] {
    const events: RaceEvent[] = [];
    if (this.state.lap > this.state.totalLaps) {
        return [];
    }

    // Weather changes
    if (Math.random() < 0.005) {
      const weathers: Weather[] = ['Dry', 'Light Rain', 'Heavy Rain'];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      if (newWeather !== this.state.weather) {
        this.state.weather = newWeather;
        events.push({ type: 'WEATHER_CHANGE', payload: { newWeather } });
      }
    }

    // Update each car
    this.state.cars.forEach(car => {
      // Handle pitting
      if (this.pitStopTimers.has(car.driver.id)) {
        let time = this.pitStopTimers.get(car.driver.id)! - 1;
        if (time <= 0) {
          this.pitStopTimers.delete(car.driver.id);
          car.isPitting = false;
          car.tire = this.state.weather === 'Dry' ? 'Medium' : 'Wet';
          car.tireWear = 0;
          events.push({ type: 'PIT_STOP_END', payload: { driverId: car.driver.id } });
        } else {
          this.pitStopTimers.set(car.driver.id, time);
        }
        return; // Skip movement if pitting
      }
      
      // Decide to pit
      if (!car.isPitting && (car.tireWear > 60 + Math.random() * 20)) {
        car.isPitting = true;
        car.pitStops += 1;
        this.pitStopTimers.set(car.driver.id, 5); // 5 ticks for a pit stop
        events.push({ type: 'PIT_STOP_START', payload: { driverId: car.driver.id } });
        return;
      }
      
      // Update speed based on various factors
      let baseSpeed = 280 + (Math.random() - 0.5) * 20; // Base speed with some randomness
      baseSpeed *= (1 - car.tireWear / 200); // Tire wear effect

      // Weather effect
      switch (this.state.weather) {
        case 'Light Rain':
          baseSpeed *= car.tire === 'Intermediate' || car.tire === 'Wet' ? 0.95 : 0.85;
          break;
        case 'Heavy Rain':
          baseSpeed *= car.tire === 'Wet' ? 0.9 : 0.75;
          break;
      }

      car.speed = baseSpeed;
      
      // Update progress
      const distance = (car.speed * 1000 / 3600) * 2; // speed in m/s * 2 second tick
      car.progress += (distance / this.state.track.length) * 100;
      
      // Update tire wear
      car.tireWear += 0.5 + Math.random() * 0.5;

      // Handle lap completion
      if (car.progress >= 100) {
        car.progress -= 100;
        car.lap += 1;
        if (car.lap > this.state.lap) {
            this.state.lap = car.lap;
        }
         if(this.state.lap > this.state.totalLaps) {
            events.push({ type: 'RACE_FINISH' });
        }
      }
    });

    // Sort cars and handle overtakes
    const oldOrder = [...this.state.cars];
    this.state.cars.sort((a, b) => {
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.progress - a.progress;
    });

    this.state.cars.forEach((car, index) => {
      const newPosition = index + 1;
      const oldCarState = oldOrder.find(c => c.driver.id === car.driver.id);
      if (oldCarState && oldCarState.position > newPosition) {
        const overtakenCar = this.state.cars.find(c => c.position === newPosition + 1);
        if(overtakenCar) {
            events.push({ type: 'OVERTAKE', payload: { overtakingCarId: car.driver.id, overtakenCarId: overtakenCar.driver.id } });
            car.highlight = true;
        }
      } else {
        car.highlight = false;
      }
      car.position = newPosition;
    });


    return events;
  }
}
