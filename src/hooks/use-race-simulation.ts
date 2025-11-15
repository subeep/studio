'use client';

import { useState, useEffect, useRef } from 'react';
import { RaceSimulation } from '@/lib/simulation';
import type { RaceState, RaceEvent, Car, Weather, Tire } from '@/lib/types';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { SimulationSettings } from '@/components/simulation-setup';

export const useRaceSimulation = (settings: SimulationSettings | null, isPaused: boolean) => {
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const simulationRef = useRef<RaceSimulation | null>(null);
  const animationFrameId = useRef<number>();
  const firestore = useFirestore();
  const { user } = useUser();
  const lastWriteTime = useRef(0);
  const WRITE_INTERVAL = 500; // Write to Firestore every 500ms

  const carsColRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'races', 'race1', 'cars');
  }, [firestore]);


  useEffect(() => {
    if (settings && !simulationRef.current) {
      const sim = new RaceSimulation(settings);
      simulationRef.current = sim;
      setRaceState(sim.state);
      setEvents([{ type: 'RACE_START' }]);
      setIsInitialized(true);
    }
  }, [settings]);

  useEffect(() => {
    if (!simulationRef.current || !isInitialized) return;

    let isLooping = true;
    
    const gameLoop = () => {
      if (!isLooping) return;

      if (simulationRef.current && !isPaused) {
        const newEvents = simulationRef.current.tick();
        if (newEvents.length > 0) {
            setEvents(prev => [...prev, ...newEvents]);
        }
        
        const currentState = simulationRef.current.state;

        // Write to firestore non-blockingly at a throttled rate
        const now = Date.now();
        if (firestore && user && now - lastWriteTime.current > WRITE_INTERVAL) {
            currentState.cars.forEach(car => {
                const carRef = doc(firestore, 'races', 'race1', 'cars', car.driver.id);
                setDoc(carRef, car, { merge: true });
            });
            lastWriteTime.current = now;
        }

        setRaceState({ ...currentState });
      }
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      isLooping = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isInitialized, firestore, user, isPaused]);

  useEffect(() => {
    if (!carsColRef || !simulationRef.current) return;

    const unsubscribes: Unsubscribe[] = [];

    const sim = simulationRef.current;
    if (sim) {
        sim.state.cars.forEach(car => {
            const carDocRef = doc(carsColRef, car.driver.id);
            const unsubscribe = onSnapshot(carDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const dbCar = docSnap.data() as Car;
                    sim.updateCarFromDb(car.driver.id, dbCar);
                }
            });
            unsubscribes.push(unsubscribe);
        });
    }

    return () => {
        unsubscribes.forEach(unsub => unsub());
    }

  }, [carsColRef, isInitialized]);


  return { raceState, events, isInitialized, simulation: simulationRef.current };
};
