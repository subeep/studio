'use client';

import { useState, useEffect, useRef } from 'react';
import { RaceSimulation } from '@/lib/simulation';
import type { RaceState, RaceEvent, Car } from '@/lib/types';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

export const useRaceSimulation = () => {
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const simulationRef = useRef<RaceSimulation | null>(null);
  const animationFrameId = useRef<number>();
  const firestore = useFirestore();
  const { user } = useUser();

  const carsColRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'races', 'race1', 'cars');
  }, [firestore]);


  useEffect(() => {
    if (!simulationRef.current) {
      const sim = new RaceSimulation();
      simulationRef.current = sim;
      setRaceState(sim.state);
      setEvents([{ type: 'RACE_START' }]);
      setIsInitialized(true);
    }

    const gameLoop = () => {
      if (simulationRef.current) {
        const newEvents = simulationRef.current.tick();
        if (newEvents.length > 0) {
            setEvents(prev => [...prev, ...newEvents]);
        }
        
        const currentState = simulationRef.current.state;

        // Write to firestore non-blockingly
        if (firestore && user) {
            currentState.cars.forEach(car => {
                const carRef = doc(firestore, 'races', 'race1', 'cars', car.driver.id);
                setDoc(carRef, car, { merge: true });
            });
        }

        setRaceState({ ...currentState });
      }
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    const intervalId = setInterval(gameLoop, 1000 / 60);

    return () => {
      clearInterval(intervalId);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [firestore, user]);

  useEffect(() => {
    if (!carsColRef) return;

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

  }, [carsColRef]);


  return { raceState, events, isInitialized };
};
