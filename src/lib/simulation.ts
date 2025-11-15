'use client';

import { DRIVERS, RACE_TRACK, TOTAL_LAPS } from './constants';
import type { Car, RaceState, RaceEvent, Weather, Tire } from './types';

export class RaceSimulation {
  public state: RaceState;
  private pitStopTimers: Map<string, number> = new Map();
  private lastTick: number = Date.now();
  private manualOverrides: Map<string, { speed?: number; tire?: Tire }> = new Map();

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
      totalDistance: 0,
      drsStatus: false,
    }));

    return {
      lap: 1,
      totalLaps: TOTAL_LAPS,
      weather: 'Dry',
      cars,
      track: RACE_TRACK,
      isFinished: false,
    };
  }

  public restart(newCars: Car[]): void {
    this.state = {
        ...this.getInitialRaceState(),
        cars: newCars,
    };
    this.pitStopTimers.clear();
    this.lastTick = Date.now();
  }


  updateCarFromDb(carId: string, carData: Partial<Car>) {
      const carIndex = this.state.cars.findIndex(c => c.driver.id === carId);
      if (carIndex !== -1) {
          const currentCar = this.state.cars[carIndex];
          const override = this.manualOverrides.get(carId) || {};
          let needsUpdate = false;

          if (carData.speed !== undefined && carData.speed !== currentCar.speed) {
              override.speed = carData.speed;
              needsUpdate = true;
          }

          if (carData.tire !== undefined && carData.tire !== currentCar.tire) {
              override.tire = carData.tire;
              this.state.cars[carIndex].tireWear = 0; // Reset tire wear on change
              needsUpdate = true;
          }

          if(needsUpdate) {
            this.manualOverrides.set(carId, override);
          }
      }
  }
  
  tick(): RaceEvent[] {
    const now = Date.now();
    const delta = (now - this.lastTick) / (1000); // time in seconds
    this.lastTick = now;

    const events: RaceEvent[] = [];
    if (this.state.lap > this.state.totalLaps) {
        return [];
    }

    // Weather changes
    if (Math.random() < 0.0005) { 
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
        let time = this.pitStopTimers.get(car.driver.id)! - delta;
        if (time <= 0) {
          this.pitStopTimers.delete(car.driver.id);
          car.isPitting = false;
          car.tire = this.state.weather === 'Dry' ? (Math.random() > 0.5 ? 'Hard' : 'Medium') : 'Wet';
          car.tireWear = 0;
          events.push({ type: 'PIT_STOP_END', payload: { driverId: car.driver.id } });
        } else {
          this.pitStopTimers.set(car.driver.id, time);
        }
        return; // Skip movement if pitting
      }
      
      const isPitWindow = car.lap >= 18 && car.lap <= 22;

      // Decide to pit
      const shouldPit = (isPitWindow && Math.random() < 0.001) ||
                      (car.tire === 'Soft' && car.tireWear > 50 + Math.random() * 10) ||
                      (car.tire === 'Medium' && car.tireWear > 70 + Math.random() * 10) ||
                      (car.tire === 'Hard' && car.tireWear > 85 + Math.random() * 10) ||
                      (this.state.weather.includes('Rain') && !['Intermediate', 'Wet'].includes(car.tire)) ||
                      (!this.state.weather.includes('Rain') && ['Intermediate', 'Wet'].includes(car.tire));

      if (!car.isPitting && shouldPit) {
        car.isPitting = true;
        car.pitStops += 1;
        this.pitStopTimers.set(car.driver.id, 2); // 2 seconds for a pit stop
        events.push({ type: 'PIT_STOP_START', payload: { driverId: car.driver.id } });
        return;
      }
      
      const override = this.manualOverrides.get(car.driver.id);
      if (override?.speed) {
        car.speed = override.speed;
      } else {
        // Update speed based on various factors
        let baseSpeed = 280;
        baseSpeed *= (1 - car.tireWear / 200);

        car.speed = baseSpeed;
      }

      if (override?.tire) {
        car.tire = override.tire;
        // Don't reset wear here, it's done in updateCarFromDb
      }

      // Tire compound effect from user request
      let tireSpeedMultiplier = 1.0;
      if (car.tire === 'Soft') tireSpeedMultiplier = 1.015; // 1.5% faster than medium
      if (car.tire === 'Hard') tireSpeedMultiplier = 0.985; // 1.5% slower than medium
      
      car.speed *= tireSpeedMultiplier;

      // DRS Effect
      const inDrsZone = this.state.track.drsZones.some(zone => car.progress / 100 >= zone.start && car.progress / 100 <= zone.end);
      if (car.drsStatus && inDrsZone) {
        car.speed *= 1.05; // 5% speed boost with DRS
      }
      

      // Weather effect
      switch (this.state.weather) {
        case 'Light Rain':
          car.speed *= car.tire === 'Intermediate' || car.tire === 'Wet' ? 0.95 : 0.85;
          break;
        case 'Heavy Rain':
          car.speed *= car.tire === 'Wet' ? 0.9 : 0.75;
          break;
      }
      
      // Update progress
      const distance = (car.speed * 1000 / 3600) * delta; 
      car.progress += (distance / this.state.track.length) * 100;
      car.totalDistance += distance;
      
      // Update tire wear
      let wearRate = 0.2;
      if (car.tire === 'Soft') wearRate = 0.4;
      if (car.tire === 'Hard') wearRate = 0.1;
      car.tireWear += wearRate * delta;

      // Handle lap completion
      if (car.progress >= 100) {
        car.progress -= 100;
        car.lap += 1;

        if (car.lap > this.state.lap) {
            this.state.lap = car.lap;
        }
         if(this.state.lap > this.state.totalLaps && !this.state.isFinished) {
            this.state.isFinished = true;
            events.push({ type: 'RACE_FINISH' });
        }
      }
    });

    // Sort cars and handle overtakes
    const oldOrder = JSON.parse(JSON.stringify(this.state.cars));
    this.state.cars.sort((a, b) => {
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.progress - a.progress;
    });

    this.state.cars.forEach((car, index) => {
      const newPosition = index + 1;
      const oldCarState = oldOrder.find((c: Car) => c.driver.id === car.driver.id);
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
      
      // DRS activation logic
      car.drsStatus = false;
      if (index > 0) { // Can't activate DRS if in first place
        const carAhead = this.state.cars[index - 1];
        const distanceToCarAhead = (carAhead.lap + carAhead.progress / 100) - (car.lap + car.progress / 100);
        const inDrsZone = this.state.track.drsZones.some(zone => car.progress / 100 >= zone.start && car.progress / 100 <= zone.end);

        if (distanceToCarAhead < 0.01 && inDrsZone && this.state.weather === 'Dry') { // roughly within 1 second
            car.drsStatus = true;
        }
      }
    });


    return events;
  }
}
