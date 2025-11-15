'use client';

import type { Car, Tire } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface ProfileDashboardProps {
  car: Car | null;
  onTireChange: (carId: string, newTire: Tire) => void;
}

const TIRE_OPTIONS: Tire[] = ['Soft', 'Medium', 'Hard'];

export function ProfileDashboard({ car, onTireChange }: ProfileDashboardProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: car.driver.color }}
          />
          {car.driver.name}
          <span className="text-sm font-medium text-muted-foreground">
            {car.driver.tricode}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Tire Strategy</h4>
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
        </div>
        <p className="text-xs text-muted-foreground">
            Changing tires will reset wear to 0% and incur a 2-second time penalty.
        </p>
      </CardContent>
    </Card>
  );
}
