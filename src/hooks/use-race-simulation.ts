'use client';

import { useState, useEffect, useRef } from 'react';
import { RaceSimulation } from '@/lib/simulation';
import type { RaceState, RaceEvent } from '@/lib/types';

export const useRaceSimulation = () => {
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const simulationRef = useRef<RaceSimulation | null>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = new RaceSimulation();
      setRaceState(simulationRef.current.state);
      setEvents([{ type: 'RACE_START' }]);
      setIsInitialized(true);
    }

    const gameLoop = () => {
      if (simulationRef.current) {
        const newEvents = simulationRef.current.tick();
        if (newEvents.length > 0) {
            setEvents(prev => [...prev, ...newEvents]);
        }
        setRaceState({ ...simulationRef.current.state });
      }
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return { raceState, events, isInitialized };
};
