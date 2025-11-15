'use client';

import type { Car } from '@/lib/types';
import { Zap, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';

interface DrsPredictionProps {
  car: Car;
  carAhead: Car | null;
}

export function DrsPrediction({ car, carAhead }: DrsPredictionProps) {
  const gap = carAhead ? carAhead.totalDistance - car.totalDistance : null;
  const slipstreamBoost = car.slipstreamBenefit * 100;
  const drsBoost = car.drsStatus ? 5 : 0;
  const totalBoost = slipstreamBoost + drsBoost;

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            DRS & Slipstream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {gap !== null && carAhead ? (
             <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <Label>Gap to {carAhead.driver.tricode}</Label>
                    <p className="font-bold text-2xl">{gap.toFixed(1)}<span className="text-base font-normal text-muted-foreground">m</span></p>
                </div>
                <div>
                    <Label>Total Boost</Label>
                    <p className="font-bold text-2xl text-primary">+{totalBoost.toFixed(1)}<span className="text-base font-normal">%</span></p>
                </div>
            </div>
        ) : (
            <p className="text-sm text-muted-foreground">No car directly ahead or out of range.</p>
        )}

        <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><Wind className="h-4 w-4" /> Slipstream</span>
                <span className="font-mono">+{slipstreamBoost.toFixed(1)}%</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><Zap className="h-4 w-4" /> DRS</span>
                <span className={car.drsStatus ? "font-mono text-primary" : "font-mono text-muted-foreground"}>
                    {car.drsStatus ? `+${drsBoost.toFixed(1)}%` : 'Inactive'}
                </span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
