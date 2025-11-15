'use client';

import { useState, useEffect, useRef } from 'react';
import type { RaceEvent, RaceState } from '@/lib/types';
import { generateCommentary } from '@/ai/flows/ai-commentary-generation';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

interface AiCommentaryProps {
  events: RaceEvent[];
  raceState: RaceState;
}

interface CommentaryItem {
  id: number;
  text: string;
}

export function AiCommentary({ events, raceState }: AiCommentaryProps) {
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastEventIndex = useRef(-1);

  useEffect(() => {
    const processEvents = async () => {
      if (events.length > lastEventIndex.current + 1) {
        const newEventIndex = lastEventIndex.current + 1;
        const newEvent = events[newEventIndex];
        lastEventIndex.current = newEventIndex;

        let description = '';
        if (newEvent.type === 'RACE_START') {
            description = "The race has just started! Lights out and away we go!";
        } else if (newEvent.type === 'OVERTAKE') {
            const { overtakingCarId, overtakenCarId } = newEvent.payload;
            const overtakingCar = raceState.cars.find(c => c.driver.id === overtakingCarId);
            const overtakenCar = raceState.cars.find(c => c.driver.id === overtakenCarId);
            if (overtakingCar && overtakenCar) {
                description = `${overtakingCar.driver.name} has just overtaken ${overtakenCar.driver.name} for P${overtakingCar.position}!`;
            }
        }

        if (description) {
            setIsLoading(true);
            try {
                const result = await generateCommentary({ raceStateDescription: description });
                if (result.commentary) {
                    setCommentary(prev => [{ id: Date.now(), text: result.commentary }, ...prev]);
                }
            } catch (error) {
                console.error("AI Commentary Error:", error);
                // Fallback to simple description if AI fails
                setCommentary(prev => [{ id: Date.now(), text: description }, ...prev]);
            } finally {
                setIsLoading(false);
            }
        }
      }
    };
    processEvents();
  }, [events, raceState]);

  return (
    <ScrollArea className="h-48 w-full rounded-md border p-4">
      <div className="flex flex-col-reverse gap-4">
        {isLoading && (
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        )}
        {commentary.map((item) => (
          <div key={item.id} className="text-sm">
            {item.text}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
