'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Flag, ChevronsRight } from 'lucide-react';
import type { FlagType } from '@/lib/types';

interface FlagSelectorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApply: (flag: FlagType) => void;
  currentFlag: FlagType;
}

const FLAGS_DATA: { type: FlagType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'Green', label: 'Green Flag', description: 'All clear. Racing continues as normal.', icon: <Flag className="h-5 w-5 text-green-500" /> },
  { type: 'Yellow', label: 'Yellow Flag', description: 'Hazard on track. Slow down, no overtaking.', icon: <Flag className="h-5 w-5 text-yellow-400" /> },
  { type: 'Red', label: 'Red Flag', description: 'Session stopped. Cars return to the pit lane.', icon: <Flag className="h-5 w-5 text-red-500" /> },
  { type: 'Blue', label: 'Blue Flag', description: 'A faster car is approaching. Let them pass.', icon: <Flag className="h-5 w-5 text-blue-500" /> },
  { type: 'White', label: 'White Flag', description: 'Slow-moving vehicle on track (e.g., an ambulance).', icon: <Flag className="h-5 w-5" /> },
  { type: 'Checkered', label: 'Checkered Flag', description: 'The race has ended.', icon: <Flag className="h-5 w-5" /> },
  { type: 'SafetyCar', label: 'Safety Car', description: 'Safety car deployed. Cars must form a line behind it and hold position.', icon: <ChevronsRight className="h-5 w-5 text-yellow-400" /> },
];

export function FlagSelector({ isOpen, onOpenChange, onApply, currentFlag }: FlagSelectorProps) {
  const [selectedFlag, setSelectedFlag] = React.useState<FlagType>(currentFlag);

  React.useEffect(() => {
    setSelectedFlag(currentFlag);
  }, [currentFlag, isOpen]);

  const handleApply = () => {
    onApply(selectedFlag);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deploy Flag or Safety Car</DialogTitle>
          <DialogDescription>
            Select a flag to change the race conditions. This will affect all drivers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={selectedFlag} onValueChange={(value: FlagType) => setSelectedFlag(value)}>
            {FLAGS_DATA.map((flag) => (
              <Label
                key={flag.type}
                htmlFor={flag.type}
                className="flex items-start gap-4 rounded-md border p-4 hover:bg-muted/50 cursor-pointer has-[:checked]:bg-accent"
              >
                <RadioGroupItem value={flag.type} id={flag.type} className="mt-1" />
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {flag.icon}
                    {flag.label}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {flag.description}
                  </p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
