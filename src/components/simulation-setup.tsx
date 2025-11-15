'use client';

import * as React from 'react';
import { DRIVERS as INITIAL_DRIVERS } from '@/lib/constants';
import type { Tire, Weather, Driver } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Cloud, CloudRain, GripVertical, Shuffle } from 'lucide-react';
import { Icons } from './icons';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

export interface SimulationSettings {
  drivers: Driver[];
  weather: Weather;
  tires: Record<string, Tire>;
}

interface SimulationSetupProps {
  onStart: (settings: SimulationSettings) => void;
}

const TIRE_OPTIONS: Tire[] = ['Soft', 'Medium', 'Hard'];
const WEATHER_OPTIONS: Weather[] = ['Dry', 'Light Rain', 'Heavy Rain'];

export function SimulationSetup({ onStart }: SimulationSetupProps) {
  const [drivers, setDrivers] = React.useState<Driver[]>(INITIAL_DRIVERS);
  const [weather, setWeather] = React.useState<Weather>('Dry');
  const [tires, setTires] = React.useState<Record<string, Tire>>(() => {
    const initialTires: Record<string, Tire> = {};
    INITIAL_DRIVERS.forEach(driver => {
      initialTires[driver.id] = 'Medium'; // Default to medium tires
    });
    return initialTires;
  });
  const [draggedDriver, setDraggedDriver] = React.useState<Driver | null>(null);

  const handleTireChange = (driverId: string, newTire: Tire) => {
    setTires(prev => ({ ...prev, [driverId]: newTire }));
  };

  const handleStart = () => {
    onStart({ drivers, weather, tires });
  };
  
  const getWeatherIcon = (weather: Weather) => {
    switch (weather) {
      case 'Dry': return <Sun className="h-5 w-5 text-yellow-400" />;
      case 'Light Rain': return <Cloud className="h-5 w-5 text-blue-300" />;
      case 'Heavy Rain': return <CloudRain className="h-5 w-5 text-blue-500" />;
    }
  }

  const handleDragStart = (driver: Driver) => {
    setDraggedDriver(driver);
  };

  const handleDragEnter = (targetDriver: Driver) => {
    if (!draggedDriver || draggedDriver.id === targetDriver.id) return;

    const newDrivers = [...drivers];
    const draggedIndex = newDrivers.findIndex(d => d.id === draggedDriver.id);
    const targetIndex = newDrivers.findIndex(d => d.id === targetDriver.id);

    newDrivers.splice(draggedIndex, 1);
    newDrivers.splice(targetIndex, 0, draggedDriver);
    setDrivers(newDrivers);
  };

  const handleDragEnd = () => {
    setDraggedDriver(null);
  };

  const handleRandomize = () => {
    setDrivers(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
             <Icons.logo className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl">Race Simulation Setup</CardTitle>
              <CardDescription>Configure the starting conditions for the race.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Weather Conditions</h3>
            <Select value={weather} onValueChange={(value: Weather) => setWeather(value)}>
                <SelectTrigger>
                    <div className="flex items-center gap-2">
                        {getWeatherIcon(weather)}
                        <SelectValue placeholder="Select weather" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {WEATHER_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>
                             <div className="flex items-center gap-2">
                                {getWeatherIcon(option)}
                                <span>{option}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Starting Grid & Tires</h3>
              <Button variant="outline" size="sm" onClick={handleRandomize}>
                <Shuffle className="mr-2 h-4 w-4" />
                Randomize
              </Button>
            </div>
             <ScrollArea className="h-72 rounded-md border">
                <div className="p-4">
                    {drivers.map((driver, index) => (
                      <div 
                        key={driver.id} 
                        className={cn(
                          "mb-2 grid cursor-grab grid-cols-[30px_1fr_150px_30px] items-center gap-4 rounded-md p-2 transition-shadow",
                          draggedDriver?.id === driver.id ? "bg-primary/20 shadow-lg" : "bg-transparent hover:bg-muted/50"
                        )}
                        draggable
                        onDragStart={() => handleDragStart(driver)}
                        onDragEnter={() => handleDragEnter(driver)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <div className="font-bold text-lg text-muted-foreground">{index + 1}</div>
                        <div>
                          <p className="font-semibold">{driver.name} <span className="text-muted-foreground">{driver.tricode}</span></p>
                          <p className="text-sm text-muted-foreground">{driver.team}</p>
                        </div>
                        <Select
                          value={tires[driver.id]}
                          onValueChange={(value: Tire) => handleTireChange(driver.id, value)}
                        >
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Select tire" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIRE_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                         <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStart} className="w-full" size="lg">
            Start Simulation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
