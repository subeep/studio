'use client';

import type { Car, Tire } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, BrainCircuit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { predictOptimalPitStop, type PredictOptimalPitStopOutput } from '@/ai/flows/predict-optimal-pitstop';
import { Skeleton } from './ui/skeleton';
import { TOTAL_LAPS } from '@/lib/constants';

interface ProfileDashboardProps {
  car: Car | null;
  onTireChange: (carId: string, newTire: Tire) => void;
  onSpeedChange: (carId: string, newSpeed: number) => void;
}

const TIRE_OPTIONS: Tire[] = ['Soft', 'Medium', 'Hard'];

function PitStopPrediction({ car }: { car: Car }) {
  const [prediction, setPrediction] = useState<PredictOptimalPitStopOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (car.pitStops >= 3) {
        setIsLoading(false);
        setPrediction(null);
        return;
    };

    setIsLoading(true);
    predictOptimalPitStop({
      tireWear: car.tireWear,
      pitStops: car.pitStops,
      currentLap: car.lap,
      totalLaps: TOTAL_LAPS,
      tireCompound: car.tire
    }).then(result => {
      setPrediction(result);
      setIsLoading(false);
    }).catch(err => {
      console.error("Error fetching pit stop prediction", err);
      setIsLoading(false);
    });
  }, [car.tireWear, car.pitStops, car.lap, car.tire]);

  if (car.pitStops >= 3) {
    return (
        <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2"><BrainCircuit /> Optimal Pit Stop</h4>
            <p className="text-sm text-muted-foreground">
                With 3 pit stops taken, no further stops are recommended.
            </p>
        </div>
    );
  }

  if (isLoading) {
    return (
        <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2"><BrainCircuit /> Optimal Pit Stop</h4>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-4/5" />
        </div>
    )
  }
  
  if (!prediction) return null;

  return (
    <div className="space-y-2">
        <h4 className="font-semibold flex items-center gap-2"><BrainCircuit /> Optimal Pit Stop</h4>
        {prediction.predictedLap ? (
            <p className="font-bold text-primary text-2xl">
                Lap {prediction.predictedLap}
            </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
            {prediction.reasoning}
        </p>
    </div>
  )
}

export function ProfileDashboard({ car, onTireChange, onSpeedChange }: ProfileDashboardProps) {
  const [speed, setSpeed] = useState(car?.speed || 0);

  useEffect(() => {
    if (car) {
      setSpeed(car.speed);
    }
  }, [car]);

  if (!car) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="text-primary" />
            Profile Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a driver from the leaderboard to see their details and manage their strategy.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSpeedUpdate = () => {
    onSpeedChange(car.driver.id, speed);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
           <div className="h-3 w-3 rounded-full" style={{ backgroundColor: car.driver.color }} />
            {car.driver.name}
             <span className="text-muted-foreground text-lg font-medium">{car.driver.tricode}</span>
        </CardTitle>
        <CardDescription>{car.driver.team}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
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

        <div className="grid md:grid-cols-2 gap-6">
            <PitStopPrediction car={car} />
            <div className="space-y-4">
              <h4 className="font-semibold">Tire Strategy</h4>
              <div className="flex gap-2">
                {TIRE_OPTIONS.map((tire) => (
                  <Button
                    key={tire}
                    variant={car.tire === tire ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onTireChange(car.driver.id, tire)}
                    disabled={car.tire === tire || car.isPitting}
                  >
                    {tire}
                  </Button>
                ))}
              </div>
               <p className="text-xs text-muted-foreground">
                Changing tires will reset wear to 0% and incur a 2-second time penalty.
            </p>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h4 className="font-semibold">Manual Control</h4>
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
      </CardContent>
    </Card>
  );
}
