'use client';

import type { Car } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { Slider } from './ui/slider';

interface DriverModalProps {
  car: Car | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSpeedChange: (carId: string, newSpeed: number) => void;
}

export function DriverModal({ car, isOpen, onOpenChange, onSpeedChange }: DriverModalProps) {
  const [speed, setSpeed] = useState(car?.speed || 0);

  useEffect(() => {
    if (car) {
      setSpeed(car.speed);
    }
  }, [car]);

  if (!car) return null;

  const handleSpeedUpdate = () => {
    onSpeedChange(car.driver.id, speed);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
             <div className="h-3 w-3 rounded-full" style={{ backgroundColor: car.driver.color }} />
            {car.driver.name}
             <span className="text-muted-foreground text-lg font-medium">{car.driver.tricode}</span>
          </DialogTitle>
          <DialogDescription>{car.driver.team}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4 text-center">
            <div>
                <Label>Position</Label>
                <p className="font-bold text-2xl">{car.position}</p>
            </div>
             <div>
                <Label>Tire</Label>
                <p className="font-bold text-lg">{car.tire}</p>
                <p className="text-xs text-muted-foreground">{car.tireWear.toFixed(0)}% worn</p>
            </div>
             <div>
                <Label>Pit Stops</Label>
                <p className="font-bold text-2xl">{car.pitStops}</p>
            </div>
        </div>
        <Separator />
        <div className="space-y-4">
            <h3 className="font-semibold">Manual Control</h3>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="speed-slider">Speed (km/h)</Label>
                    <span className="font-mono text-sm">{speed.toFixed(0)}</span>
                </div>
                <Slider 
                    id="speed-slider"
                    min={0}
                    max={360}
                    step={5}
                    value={[speed]}
                    onValueChange={(value) => setSpeed(value[0])}
                />
            </div>
            <Button onClick={handleSpeedUpdate} className="w-full">Update Speed</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
