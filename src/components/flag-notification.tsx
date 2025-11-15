'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronsRight } from 'lucide-react';
import type { FlagType } from '@/lib/types';

interface FlagNotificationProps {
  flagType: Extract<FlagType, 'SafetyCar'>;
  timeLeft: number;
}

export function FlagNotification({ flagType, timeLeft }: FlagNotificationProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Alert>
        <ChevronsRight className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Safety Car Deployed</span>
          <span className="font-mono text-base">{timeString}</span>
        </AlertTitle>
        <AlertDescription>
          Overtaking is not permitted. All cars must line up behind the safety car.
        </AlertDescription>
      </Alert>
    </div>
  );
}
