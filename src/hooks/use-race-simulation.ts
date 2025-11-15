'use client';

import { useState, useEffect, useRef } from 'react';
import { RaceSimulation } from '@/lib/simulation';
import type { RaceState, RaceEvent } from '@/lib/types';

export const useRaceSimulation = () => {
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const simulationRef = useRef<RaceSimulation | null>(null);

  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = new RaceSimulation();
      setRaceState(simulationRef.current.state);
      setEvents([{ type: 'RACE_START' }]);
      setIsInitialized(true);
    }

    const interval = setInterval(() => {
      if (simulationRef.current) {
        const newEvents = simulationRef.current.tick();
        if (newEvents.length > 0) {
            setEvents(prev => [...prev, ...newEvents]);
        }
        setRaceState({ ...simulationRef.current.state });
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return { raceState, events, isInitialized };
};
