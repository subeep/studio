'use client';

import * as React from 'react';
import { useRaceSimulation } from '@/hooks/use-race-simulation';
import { Leaderboard } from '@/components/leaderboard';
import { RaceTrack } from '@/components/race-track';
import { ProfileDashboard } from '@/components/profile-dashboard';
import { WeatherDisplay } from '@/components/weather-display';
import type { Car, Tire } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Flag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
        setDoc(raceRef, {id: 'race1', weatherConditions: raceState.weather, timestamp: new Date().toISOString() }, { merge: true });

        DRIVERS.forEach(driver => {
            const carRef = doc(raceRef, 'cars', driver.id);
            const carData = raceState.cars.find(c => c.driver.id === driver.id);
            if (carData) {
                setDoc(carRef, { ...carData, driver: {...carData.driver} }, { merge: true });
            }
        });
    }
  }, [user, isInitialized, firestore, raceState]);

  const handleDriverSelect = (car: Car) => {
    setSelectedCar(car);
  };

  const handleSpeedChange = async (carId: string, newSpeed: number) => {
    if (firestore) {
      const carRef = doc(firestore, 'races', 'race1', 'cars', carId);
      await setDoc(carRef, { speed: newSpeed }, { merge: true });
    }
  };
  
  const handleTireChange = async (carId: string, newTire: Tire) => {
    if (firestore) {
      const carRef = doc(firestore, 'races', 'race1', 'cars', carId);
      
      // Get the car's current state from the database to ensure we have the latest speed
      const carSnap = await getDoc(carRef);
      if (!carSnap.exists()) return;

      const carData = carSnap.data() as Car;
      const originalSpeed = carData.speed;

      // Introduce a 2-second penalty by briefly reducing speed for this car only
      await setDoc(carRef, { speed: originalSpeed * 0.9 }, { merge: true });
      
      setTimeout(async () => {
        await setDoc(carRef, { tire: newTire, tireWear: 0, speed: originalSpeed }, { merge: true });
      }, 2000);
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
              <ProfileDashboard car={selectedCar} onTireChange={handleTireChange} onSpeedChange={handleSpeedChange} />
            </div>
          </div>

          <div className="lg:col-span-1 xl:col-span-1">
            <Leaderboard
              cars={raceState.cars}
              onDriverSelect={handleDriverSelect}
              events={events}
              selectedCarId={selectedCar?.driver.id}
            />
          </div>
        </main>
      </div>
    </>
  );
}
