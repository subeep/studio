'use client';

import { RACE_TRACK, TOTAL_LAPS } from './constants';
import type { Car, RaceState, RaceEvent, Weather, Tire, FlagType, WindDirection, LogEntry } from './types';
import type { SimulationSettings } from '@/components/simulation-setup';

export class RaceSimulation {
  public state: RaceState;
  private pitStopTimers: Map<string, number> = new Map();
  private lastTick: number | null = null;
  private manualOverrides: Map<string, { speed?: number; tire?: Tire }> = new Map();
  private weatherChangeTimer: number = 0;
  private windChangeTimer: number = 0;
  private trackWetness: number = 0; // 0 = Dry, 100 = Very Wet
  private logCallback: (logEntry: LogEntry) => void;
  private logTimer: number = 0;

  constructor(settings: SimulationSettings, logCallback: (logEntry: LogEntry) => void) {
    this.logCallback = logCallback;
    this.state = this.getInitialRaceState(settings);
    this.weatherChangeTimer = 20 + Math.random() * 40; // Change weather every 20-60s
    this.windChangeTimer = 15 + Math.random() * 30; // Change wind every 15-45s
  }

  private getInitialRaceState(settings: SimulationSettings): RaceState {
    const cars: Car[] = settings.drivers.map((driver, index) => ({
      driver,
      position: index + 1,
      lap: 1,
      progress: 0,
      speed: 180 + Math.random() * 20 - 10, // Reduced variance
      tire: settings.tires[driver.id] || 'Medium',
      tireWear: 0,
      isPitting: false,
      pitStops: 0,
      highlight: false,
      totalDistance: 0,
      drsStatus: false,
      interval: 0,
      fuel: 100,
    }));
    
    this.trackWetness = settings.weather === 'Dry' ? 0 : settings.weather === 'Light Rain' ? 40 : 80;

    return {
      lap: 1,
      totalLaps: TOTAL_LAPS,
      weather: settings.weather,
      trackCondition: this.getTrackConditionFromWetness(),
      windSpeed: 5 + Math.random() * 15, // 5-20 km/h
      windDirection: 'Headwind',
      cars,
      track: RACE_TRACK,
      isFinished: false,
      activeFlag: 'Green',
    };
  }
  
  private getTrackConditionFromWetness() {
    if (this.trackWetness < 10) return 'Dry';
    if (this.trackWetness < 40) return 'Damp';
    if (this.trackWetness < 80) return 'Wet';
    return 'Very Wet';
  }

  public setFlag(flag: FlagType): RaceEvent[] {
    if (this.state.activeFlag === flag) return [];
    this.state.activeFlag = flag;
    
    if (flag === 'SafetyCar') {
      this.state.safetyCarTimeLeft = 60;
    } else {
      delete this.state.safetyCarTimeLeft;
    }
    
    if (flag === 'Green') {
      delete this.state.safetyCarTimeLeft;
    }

    return [{ type: 'FLAG_CHANGE', payload: { newFlag: flag }}];
  }

  public restartRace(currentCars: Car[]): void {
    // Reset progress to 0 for a standing start, but keep lap, position, etc.
    const newCars = currentCars.map(car => ({
      ...car,
      progress: 0,
      isPitting: false,
      drsStatus: false,
      speed: 180 + Math.random() * 20 - 10, // Reset to a base speed
    }));
    
    this.state.cars = newCars;
    this.state.activeFlag = 'Green';
    this.pitStopTimers.clear();
    this.lastTick = null; // Ensure tick timer resets
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
    if (this.lastTick === null) {
      this.lastTick = now;
      return [];
    }

    let delta = (now - this.lastTick) / 1000; // time in seconds

    // If the delta is very large (e.g., > 1 second), it means we've likely resumed from a pause.
    // In this case, we'll treat it as a small, fixed delta to avoid a huge time jump.
    if (delta > 1) {
      delta = 1 / 60; // Assume 60fps, so use a small delta.
    }

    this.lastTick = now;

    const events: RaceEvent[] = [];
    if (this.state.isFinished || this.state.lap > this.state.totalLaps) {
        return [];
    }
    
    // Update weather and track condition
    this.weatherChangeTimer -= delta;
    if (this.weatherChangeTimer <= 0) {
        const weatherOptions: Weather[] = ['Dry', 'Light Rain', 'Heavy Rain'];
        const newWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
        if (newWeather !== this.state.weather) {
            this.state.weather = newWeather;
            events.push({ type: 'WEATHER_CHANGE', payload: { newWeather }});
        }
        this.weatherChangeTimer = 20 + Math.random() * 40;
    }
    
    // Update wind
    this.windChangeTimer -= delta;
    if (this.windChangeTimer <= 0) {
      const directions: WindDirection[] = ['Headwind', 'Tailwind', 'Crosswind'];
      this.state.windDirection = directions[Math.floor(Math.random() * directions.length)];
      this.state.windSpeed = 5 + Math.random() * 25; // 5-30 km/h
      this.windChangeTimer = 15 + Math.random() * 30;
    }

    // Update track wetness
    if (this.state.weather === 'Light Rain') {
        this.trackWetness = Math.min(100, this.trackWetness + delta * 2); // gets wetter slowly
    } else if (this.state.weather === 'Heavy Rain') {
        this.trackWetness = Math.min(100, this.trackWetness + delta * 5); // gets wetter quickly
    } else {
        this.trackWetness = Math.max(0, this.trackWetness - delta * 1); // dries slowly
    }
    this.state.trackCondition = this.getTrackConditionFromWetness();


    // Update Safety Car timer
    if (this.state.safetyCarTimeLeft !== undefined) {
      this.state.safetyCarTimeLeft -= delta;
      if (this.state.safetyCarTimeLeft <= 0) {
        delete this.state.safetyCarTimeLeft;
        this.state.activeFlag = 'Green';
        events.push({ type: 'FLAG_CHANGE', payload: { newFlag: 'Green' } });
      }
    }


    // Apply flag effects
    let speedMultiplier = 1.0;
    let isOvertakingAllowed = true;
    switch (this.state.activeFlag) {
      case 'Yellow':
        speedMultiplier = 0.6;
        isOvertakingAllowed = false;
        break;
      case 'SafetyCar':
        speedMultiplier = 0.4;
        isOvertakingAllowed = false;
        break;
      case 'Red':
        return []; // Stop all simulation
    }


    // Update each car
    this.state.cars.forEach(car => {
      // Handle pitting
      if (this.pitStopTimers.has(car.driver.id)) {
        let time = this.pitStopTimers.get(car.driver.id)! - delta;
        if (time <= 0) {
          this.pitStopTimers.delete(car.driver.id);
          car.isPitting = false;
          // Logic for choosing new tire can be more complex
          car.tire = this.state.weather === 'Dry' ? (Math.random() > 0.5 ? 'Hard' : 'Medium') : 'Wet';
          car.tireWear = 0;
          car.fuel = 100; // Refuel on pit stop
          events.push({ type: 'PIT_STOP_END', payload: { driverId: car.driver.id } });
          this.logCallback({ timestamp: Date.now(), carName: car.driver.tricode, lap: car.lap, position: car.position, speed: car.speed, tire: car.tire, message: `Exits the pit lane on ${car.tire} tires.` });
        } else {
          this.pitStopTimers.set(car.driver.id, time);
        }
        return; // Skip movement if pitting
      }
      
      const isPitWindow = car.lap >= 18 && car.lap <= 22;

      // Decide to pit. Pitting under safety car is a strategic choice.
      const shouldPit = (this.state.activeFlag === 'SafetyCar' && Math.random() < 0.005) || // Low chance to strategically pit
                      (isPitWindow && Math.random() < 0.001) ||
                      (car.tire === 'Soft' && car.tireWear > 50 + Math.random() * 10) ||
                      (car.tire === 'Medium' && car.tireWear > 70 + Math.random() * 10) ||
                      (car.tire === 'Hard' && car.tireWear > 85 + Math.random() * 10) ||
                      (car.fuel < 5); // Pit if fuel is low

      if (!car.isPitting && shouldPit) {
        car.isPitting = true;
        car.pitStops += 1;
        this.pitStopTimers.set(car.driver.id, 2 + Math.random()); // Pit stop duration
        events.push({ type: 'PIT_STOP_START', payload: { driverId: car.driver.id } });
        this.logCallback({ timestamp: Date.now(), carName: car.driver.tricode, lap: car.lap, position: car.position, speed: car.speed, tire: car.tire, message: 'Boxes for a pit stop.' });
        return;
      }
      
      const override = this.manualOverrides.get(car.driver.id);
      if (override?.speed) {
        car.speed = override.speed;
      } else {
        // Update speed based on various factors
        let baseSpeed = 300;
        baseSpeed *= (1 - car.tireWear / 200);
        // Fuel effect: lighter car is faster. Max 3% speed boost at empty.
        baseSpeed *= (1 + (1 - car.fuel / 100) * 0.03); 

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
      

      // Weather effect based on track condition
      switch (this.state.trackCondition) {
        case 'Damp':
          car.speed *= car.tire === 'Intermediate' ? 0.98 : 0.9;
          break;
        case 'Wet':
          car.speed *= (car.tire === 'Intermediate' || car.tire === 'Wet') ? 0.95 : 0.85;
          break;
        case 'Very Wet':
          car.speed *= car.tire === 'Wet' ? 0.9 : 0.75;
          break;
      }
      
      // Wind Effect
      let windEffect = 0;
      if (this.state.windDirection === 'Tailwind') {
        windEffect = this.state.windSpeed * 0.2; // Tailwind provides a small boost
      } else if (this.state.windDirection === 'Headwind') {
        windEffect = -this.state.windSpeed * 0.3; // Headwind has a slightly stronger negative effect
      }
      car.speed += windEffect;


      // Apply flag speed multiplier
      car.speed *= speedMultiplier;

      // Enforce hard speed limit
      car.speed = Math.min(car.speed, 330);

      // Update progress
      const distance = (car.speed * 1000 / 3600) * delta; 
      car.progress += (distance / this.state.track.length) * 100;
      car.totalDistance += distance;
      
      // Update tire wear & fuel
      let wearRate = 0.2;
      if (car.tire === 'Soft') wearRate = 0.4;
      if (car.tire === 'Hard') wearRate = 0.1;
      car.tireWear += wearRate * delta;
      
      const fuelConsumptionRate = 1.8 / TOTAL_LAPS; // Percentage of fuel per lap
      car.fuel -= (distance / this.state.track.length) * fuelConsumptionRate * 100;
      car.fuel = Math.max(0, car.fuel);

      // Handle lap completion
      if (car.progress >= 100) {
        car.progress -= 100;
        car.lap += 1;

        if (car.lap > this.state.lap) {
            this.state.lap = car.lap;
        }
         if(this.state.lap > this.state.totalLaps && !this.state.isFinished) {
            this.state.isFinished = true;
            this.state.activeFlag = 'Checkered';
            events.push({ type: 'RACE_FINISH' });
        }
      }
    });

    if (isOvertakingAllowed) {
        // Sort cars and handle overtakes
        const oldOrder = [...this.state.cars];
        this.state.cars.sort((a, b) => b.totalDistance - a.totalDistance);

        this.state.cars.forEach((car, index) => {
            const newPosition = index + 1;
            const oldCarState = oldOrder.find((c: Car) => c.driver.id === car.driver.id);
            if (oldCarState && oldCarState.position > newPosition) {
                const overtakenCar = this.state.cars.find(c => c.position === newPosition + 1);
                if(overtakenCar) {
                    events.push({ type: 'OVERTAKE', payload: { overtakingCarId: car.driver.id, overtakenCarId: overtakenCar.driver.id } });
                    car.highlight = true;
                    this.logCallback({ timestamp: Date.now(), carName: car.driver.tricode, lap: car.lap, position: newPosition, speed: car.speed, tire: car.tire, message: `Overtakes ${overtakenCar.driver.tricode} for P${newPosition}` });
                }
            } else {
                car.highlight = false;
            }
            car.position = newPosition;

            // DRS activation logic & Interval calculation
            car.drsStatus = false;
            if (index > 0) {
                const carAhead = this.state.cars[index - 1];
                const distanceToCarAhead = carAhead.totalDistance - car.totalDistance;
                const timeToCarAhead = distanceToCarAhead / (carAhead.speed / 3.6); // time in seconds
                car.interval = timeToCarAhead;

                const inDrsZone = this.state.track.drsZones.some(zone => car.progress / 100 >= zone.start && car.progress / 100 <= zone.end);

                if (timeToCarAhead < 1.0 && inDrsZone && this.state.weather === 'Dry' && this.state.activeFlag === 'Green') {
                    car.drsStatus = true;
                }
            } else {
                car.interval = 0; // Leader has no interval
            }
        });
    } else {
        // When overtaking is not allowed, cars should still "bunch up" but not re-order
        this.state.cars.sort((a, b) => a.position - b.position).forEach((car, index) => {
            car.highlight = false; // no highlights during these periods
            car.drsStatus = false; // DRS is always off

            if (index > 0) {
                const carAhead = this.state.cars[index -1];
                const carAheadTotalDistance = carAhead.totalDistance;
                const currentCarTotalDistance = car.totalDistance;
                
                const idealGap = 10; // meters

                // If current car is too close or has passed, adjust its position
                if (currentCarTotalDistance > carAheadTotalDistance - idealGap) {
                   const distanceToPullBack = currentCarTotalDistance - (carAheadTotalDistance - idealGap);
                   car.totalDistance -= distanceToPullBack;
                   // Recalculate progress based on new totalDistance
                   const lapsCompleted = Math.floor(car.totalDistance / this.state.track.length);
                   car.lap = lapsCompleted + 1;
                   const distanceIntoLap = car.totalDistance % this.state.track.length;
                   car.progress = (distanceIntoLap / this.state.track.length) * 100;
                }
            }
        })
    }

    // Periodic logging
    this.logTimer -= delta;
    if (this.logTimer <= 0) {
      const leader = this.state.cars[0];
      if (leader) {
        this.logCallback({ timestamp: Date.now(), carName: leader.driver.tricode, lap: leader.lap, position: 1, speed: leader.speed, tire: leader.tire, message: 'Current race leader update.' });
      }
      this.logTimer = 5; // Log every 5 seconds
    }


    return events;
  }
}
