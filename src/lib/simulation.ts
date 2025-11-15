'use client';

import { RACE_TRACK, TOTAL_LAPS } from './constants';
import type { Car, RaceState, RaceEvent, Weather, Tire, FlagType, WindDirection, LogEntry } from './types';
import type { SimulationSettings } from '@/components/simulation-setup';

export class RaceSimulation {
  public state: RaceState;
  private pitStopTimers: Map<string, number> = new Map();
  private lastTick: number | null = null;
  private manualOverrides: Map<string, { speed?: number; tire?: Tire }> = new Map();
  private windChangeTimer: number = 0;
  private trackWetness: number = 0; // 0 = Dry, 100 = Very Wet
  private logCallback: (logEntry: LogEntry) => void;
  private logTimer: number = 0;

  constructor(settings: SimulationSettings, logCallback: (logEntry: LogEntry) => void) {
    this.logCallback = logCallback;
    this.state = this.getInitialRaceState(settings);
    this.windChangeTimer = 15 + Math.random() * 30; // Change wind every 15-45s
  }

  private getInitialRaceState(settings: SimulationSettings): RaceState {
    const cars: Car[] = settings.drivers.map((driver, index) => ({
      driver,
      position: index + 1,
      lap: 1,
      progress: 0,
      speed: 180 + Math.random() * 20 - 10,
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

    if (delta > 1) {
      delta = 1 / 60; 
    }

    this.lastTick = now;

    const events: RaceEvent[] = [];
    if (this.state.isFinished || this.state.lap > this.state.totalLaps) {
        return [];
    }
    
    // Update wind
    this.windChangeTimer -= delta;
    if (this.windChangeTimer <= 0) {
      const directions: WindDirection[] = ['Headwind', 'Tailwind', 'Crosswind'];
      this.state.windDirection = directions[Math.floor(Math.random() * directions.length)];
      this.state.windSpeed = 5 + Math.random() * 25; // 5-30 km/h
      this.windChangeTimer = 15 + Math.random() * 30;
    }

    // Update track wetness based on static weather
    if (this.state.weather === 'Light Rain') {
      this.trackWetness = 40;
    } else if (this.state.weather === 'Heavy Rain') {
      this.trackWetness = 80;
    } else {
      this.trackWetness = 0;
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
          car.tire = this.state.weather === 'Dry' ? (Math.random() > 0.5 ? 'Hard' : 'Medium') : 'Wet';
          car.tireWear = 0;
          car.fuel = 100; // Refuel on pit stop
          events.push({ type: 'PIT_STOP_END', payload: { driverId: car.driver.id } });
        } else {
          this.pitStopTimers.set(car.driver.id, time);
        }
        return; // Skip movement if pitting
      }
      
      const isPitWindow = car.lap >= 18 && car.lap <= 22;

      const shouldPit = (this.state.activeFlag === 'SafetyCar' && Math.random() < 0.005) ||
                      (isPitWindow && Math.random() < 0.001) ||
                      (car.tire === 'Soft' && car.tireWear > 50 + Math.random() * 10) ||
                      (car.tire === 'Medium' && car.tireWear > 70 + Math.random() * 10) ||
                      (car.tire === 'Hard' && car.tireWear > 85 + Math.random() * 10) ||
                      (car.fuel < 5);

      if (!car.isPitting && shouldPit) {
        car.isPitting = true;
        car.pitStops += 1;
        this.pitStopTimers.set(car.driver.id, 2 + Math.random()); // Pit stop duration
        events.push({ type: 'PIT_STOP_START', payload: { driverId: car.driver.id } });
        return;
      }
      
      const override = this.manualOverrides.get(car.driver.id);
      if (override?.speed) {
        car.speed = override.speed;
      } else {
        let baseSpeed = 300;
        baseSpeed *= (1 - car.tireWear / 200);
        baseSpeed *= (1 + (1 - car.fuel / 100) * 0.03); 

        car.speed = baseSpeed;
      }

      if (override?.tire) {
        car.tire = override.tire;
      }

      let tireSpeedMultiplier = 1.0;
      if (car.tire === 'Soft') tireSpeedMultiplier = 1.015;
      if (car.tire === 'Hard') tireSpeedMultiplier = 0.985;
      
      car.speed *= tireSpeedMultiplier;

      const inDrsZone = this.state.track.drsZones.some(zone => car.progress / 100 >= zone.start && car.progress / 100 <= zone.end);
      if (car.drsStatus && inDrsZone) {
        car.speed *= 1.05;
      }
      
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
      
      let windEffect = 0;
      if (this.state.windDirection === 'Tailwind') {
        windEffect = this.state.windSpeed * 0.2;
      } else if (this.state.windDirection === 'Headwind') {
        windEffect = -this.state.windSpeed * 0.3;
      }
      car.speed += windEffect;

      car.speed *= speedMultiplier;

      car.speed = Math.min(car.speed, 330);

      const distance = (car.speed * 1000 / 3600) * delta; 
      car.progress += (distance / this.state.track.length) * 100;
      car.totalDistance += distance;
      
      let wearRate = 0.2;
      if (car.tire === 'Soft') wearRate = 0.4;
      if (car.tire === 'Hard') wearRate = 0.1;
      car.tireWear += wearRate * delta;
      
      const fuelConsumptionRate = 1.8 / TOTAL_LAPS;
      car.fuel -= (distance / this.state.track.length) * fuelConsumptionRate * 100;
      car.fuel = Math.max(0, car.fuel);

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
                }
            } else {
                car.highlight = false;
            }
            car.position = newPosition;

            car.drsStatus = false;
            if (index > 0) {
                const carAhead = this.state.cars[index - 1];
                const distanceToCarAhead = carAhead.totalDistance - car.totalDistance;
                const timeToCarAhead = distanceToCarAhead / (carAhead.speed / 3.6);
                car.interval = timeToCarAhead;

                const inDrsZone = this.state.track.drsZones.some(zone => car.progress / 100 >= zone.start && car.progress / 100 <= zone.end);

                if (timeToCarAhead < 1.0 && inDrsZone && this.state.weather === 'Dry' && this.state.activeFlag === 'Green') {
                    car.drsStatus = true;
                }
            } else {
                car.interval = 0;
            }
        });
    } else {
        this.state.cars.sort((a, b) => a.position - b.position).forEach((car, index) => {
            car.highlight = false;
            car.drsStatus = false;

            if (index > 0) {
                const carAhead = this.state.cars[index -1];
                const carAheadTotalDistance = carAhead.totalDistance;
                const currentCarTotalDistance = car.totalDistance;
                
                const idealGap = 10;

                if (currentCarTotalDistance > carAheadTotalDistance - idealGap) {
                   const distanceToPullBack = currentCarTotalDistance - (carAheadTotalDistance - idealGap);
                   car.totalDistance -= distanceToPullBack;
                   const lapsCompleted = Math.floor(car.totalDistance / this.state.track.length);
                   car.lap = lapsCompleted + 1;
                   const distanceIntoLap = car.totalDistance % this.state.track.length;
                   car.progress = (distanceIntoLap / this.state.track.length) * 100;
                }
            }
        })
    }

    this.logTimer -= delta;
    if (this.logTimer <= 0) {
      this.state.cars.forEach(car => {
          this.logCallback({
              timestamp: Date.now(),
              carName: car.driver.tricode,
              lap: car.lap,
              position: car.position,
              speed: car.speed,
              tire: car.tire,
              fuel: car.fuel,
              message: `P${car.position} | Lap ${car.lap} | Spd: ${car.speed.toFixed(0)} | Fuel: ${car.fuel.toFixed(0)}%`
          });
      });
      this.logTimer = 1; // Log every 1 second
    }


    return events;
  }
}
