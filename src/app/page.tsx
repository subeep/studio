'use client';

import * as React from 'react';
import { useRaceSimulation } from '@/hooks/use-race-simulation';
import { Leaderboard } from '@/components/leaderboard';
import { RaceTrack } from '@/components/race-track';
import { AiCommentary } from '@/components/ai-commentary';
import { WeatherDisplay } from '@/components/weather-display';
import type { Car } from '@/lib/types';
import { DriverModal } from '@/components/driver-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Flag, Cpu } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc } from 'firebase/firestore';
import { DRIVERS } from '@/lib/constants';

export default function CircuitVisionPage() {
  const { raceState, events, isInitialized } = useRaceSimulation();
  const [selectedCar, setSelectedCar] = React.useState<Car | null>(null);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  React.useEffect(() => {
    if (user && isInitialized && raceState) {
        const raceRef = doc(firestore, 'races', 'race1');
        DRIVERS.forEach(driver => {
            const carRef = doc(raceRef, 'cars', driver.id);
            const carData = raceState.cars.find(c => c.driver.id === driver.id);
            if (carData) {
                setDoc(carRef, carData, { merge: true });
            }
        });
    }
  }, [user, isInitialized, firestore]);

  const handleDriverSelect = (car: Car) => {
    setSelectedCar(car);
  };

  const handleSpeedChange = async (carId: string, newSpeed: number) => {
    if (firestore) {
      const carRef = doc(firestore, 'races', 'race1', 'cars', carId);
      await setDoc(carRef, { speed: newSpeed }, { merge: true });
    }
  };


  if (!isInitialized || !raceState) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <Icons.logo className="h-16 w-16 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Circuit Vision</h1>
          <p className="text-muted-foreground">Warming up the engines...</p>
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background font-body text-foreground">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Icons.logo className="h-8 w-8 text-primary" />
              <h1 className="hidden text-xl font-bold tracking-tight sm:block">
                Circuit Vision
              </h1>
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-card p-2 text-sm">
                <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-primary" />
                    <span>Lap: <span className="font-bold">{raceState.lap > raceState.totalLaps ? raceState.totalLaps : raceState.lap}/{raceState.totalLaps}</span></span>
                </div>
                <WeatherDisplay weather={raceState.weather} />
            </div>
          </div>
        </header>

        <main className="container mx-auto grid grid-cols-1 gap-6 p-4 lg:grid-cols-3 xl:grid-cols-4">
          <div className="lg:col-span-2 xl:col-span-3">
            <div className="flex flex-col gap-6">
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <RaceTrack
                    cars={raceState.cars}
                    track={raceState.track}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Cpu className="text-primary" />
                    Live Commentary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AiCommentary events={events} raceState={raceState} />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1 xl:col-span-1">
            <Leaderboard
              cars={raceState.cars}
              onDriverSelect={handleDriverSelect}
              events={events}
            />
          </div>
        </main>
      </div>
      <DriverModal
        car={selectedCar}
        isOpen={!!selectedCar}
        onOpenChange={() => setSelectedCar(null)}
        onSpeedChange={handleSpeedChange}
      />
    </>
  );
}
