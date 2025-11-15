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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface DriverModalProps {
  car: Car | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DriverModal({ car, isOpen, onOpenChange }: DriverModalProps) {
  if (!car) return null;

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
        <div>
            <h3 className="font-semibold mb-4">Prop Bets</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="bet-finish" className="flex-shrink-0">Finish in Top 3</Label>
                    <Input id="bet-finish" type="number" placeholder="Wager amount" className="w-32" />
                    <Button>Place Bet</Button>
                </div>
                 <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="bet-fastest" className="flex-shrink-0">Set Fastest Lap</Label>
                    <Input id="bet-fastest" type="number" placeholder="Wager amount" className="w-32" />
                    <Button>Place Bet</Button>
                </div>
                 <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="bet-pit" className="flex-shrink-0">Next to Pit</Label>
                     <Input id="bet-pit" type="number" placeholder="Wager amount" className="w-32" />
                    <Button variant="secondary">AI Suggestion</Button>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">
                    This is a mock betting interface. Bets are not real.
                </p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
