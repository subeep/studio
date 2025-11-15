'use client';

import React, { useEffect, useState } from 'react';
import type { Car, RaceEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Users } from 'lucide-react';

interface LeaderboardProps {
  cars: Car[];
  onDriverSelect: (car: Car) => void;
  events: RaceEvent[];
}

export function Leaderboard({ cars, onDriverSelect }: LeaderboardProps) {
  const [highlightedCars, setHighlightedCars] = useState<Set<string>>(new Set());

  useEffect(() => {
    cars.forEach(car => {
      if (car.highlight) {
        setHighlightedCars(prev => new Set(prev).add(car.driver.id));
        const timer = setTimeout(() => {
          setHighlightedCars(prev => {
            const newSet = new Set(prev);
            newSet.delete(car.driver.id);
            return newSet;
          });
        }, 2000);
        return () => clearTimeout(timer);
      }
    });
  }, [cars]);


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[60vh] md:h-[70vh]">
          <div className="flex flex-col gap-1">
            {cars.map((car, index) => (
              <div
                key={car.driver.id}
                onClick={() => onDriverSelect(car)}
                className={cn(
                  'flex cursor-pointer items-center gap-4 border-b p-3 transition-all duration-500 hover:bg-muted/50',
                   highlightedCars.has(car.driver.id) ? 'bg-primary/20' : 'bg-transparent'
                )}
              >
                <div className="flex w-12 items-center gap-2">
                  <span className="w-6 text-center font-bold text-lg">{car.position}</span>
                  <div className="h-6 w-1 rounded-full" style={{ backgroundColor: car.driver.color }} />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{car.driver.tricode}</p>
                  <p className="text-xs text-muted-foreground">{car.driver.team}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-mono">
                        {(car.totalDistance / 1000).toFixed(2)}km
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {car.isPitting ? 'IN PIT' : `L ${car.lap}`}
                    </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
