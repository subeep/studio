'use client';

import * as React from 'react';
import { useRaceSimulation } from '@/hooks/use-race-simulation';
import { Leaderboard } from '@/components/leaderboard';
import { RaceTrack } from '@/components/race-track';
import { ProfileDashboard } from '@/components/profile-dashboard';
import { WeatherDisplay } from '@/components/weather-display';
import type { Car, Tire, Weather } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Flag } from 'lucide-react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { DRIVERS } from '@/lib/constants';
import { SimulationSetup, type SimulationSettings } from '@/components/simulation-setup';

export default function CircuitVisionPage() {
  const [settings, setSettings] = React.useState<SimulationSettings | null>(null);
  const { raceState, events, isInitialized, simulation } = useRaceSimulation(settings);
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
      
      const carSnap = await getDoc(carRef);
      if (!carSnap.exists()) return;

      const carData = carSnap.data() as Car;
      const originalSpeed = carData.speed;

      // Immediately set the new tire, reset wear, and apply the speed penalty.
      await setDoc(carRef, { 
        tire: newTire, 
        tireWear: 0,
        speed: originalSpeed * 0.9 
      }, { merge: true });
      
      // After 2 seconds, restore the original speed.
      setTimeout(async () => {
        await setDoc(carRef, { speed: originalSpeed }, { merge: true });
      }, 2000);
    }
  };
  
  const handleStartSimulation = (newSettings: SimulationSettings) => {
    setSettings(newSettings);
  };


  if (!isInitialized || !raceState || !settings) {
    return <SimulationSetup onStart={handleStartSimulation} />;
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
