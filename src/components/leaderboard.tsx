'use client';

import React, { useEffect, useState } from 'react';
import type { Car, RaceEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Users, Zap } from 'lucide-react';
import { Badge } from './ui/badge';

interface LeaderboardProps {
  cars: Car[];
  onDriverSelect: (car: Car) => void;
  events: RaceEvent[];
  selectedCarId?: string | null;
}

export function Leaderboard({ cars, onDriverSelect, selectedCarId }: LeaderboardProps) {
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
          <div className="flex flex-col">
            {cars.map((car, index) => {
              let intervalDisplay: string;
              if (index === 0) {
                const totalSeconds = car.raceTime;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = Math.floor(totalSeconds % 60);
                const millis = Math.floor((totalSeconds % 1) * 100);
                intervalDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2,'0')}`;
              } else {
                intervalDisplay = `+${car.interval.toFixed(2)}s`;
              }
              
              return (
              <div
                key={car.driver.id}
                onClick={() => onDriverSelect(car)}
                className={cn(
                  'flex cursor-pointer items-center gap-4 border-b p-3 transition-all duration-500 hover:bg-muted/50',
                   highlightedCars.has(car.driver.id) ? 'bg-primary/20' : 'bg-transparent',
                   selectedCarId === car.driver.id ? 'bg-accent' : ''
                )}
              >
                <div className="flex w-12 items-center gap-2">
                  <span className="w-6 text-center font-bold text-lg">{car.position}</span>
                  <div className="h-6 w-1 rounded-full" style={{ backgroundColor: car.driver.color }} />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold flex items-center gap-2">
                    {car.driver.tricode}
                    {car.drsStatus && (
                        <Badge variant="outline" className="border-primary text-primary h-5 px-1.5">
                            <Zap className="w-3 h-3 fill-current" />
                        </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{car.driver.team}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-mono">
                        {intervalDisplay}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {car.isPitting ? 'IN PIT' : `L ${car.lap}`}
                    </p>
                </div>
              </div>
            )})}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
