'use client';

import type { WindDirection } from '@/lib/types';
import { Wind, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface WindIndicatorProps {
  speed: number;
  direction: WindDirection;
}

const directionInfo = {
  Headwind: { icon: ArrowDown, label: 'Headwind' },
  Tailwind: { icon: ArrowUp, label: 'Tailwind' },
  Crosswind: { icon: ArrowLeftRight, label: 'Crosswind' },
};

export function WindIndicator({ speed, direction }: WindIndicatorProps) {
  const { icon: Icon, label } = directionInfo[direction];

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg flex items-center gap-2">
            <Wind className="h-5 w-5 text-primary" />
            Wind
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
         <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{speed.toFixed(0)}<span className="text-base font-normal text-muted-foreground">km/h</span></p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
         </div>
         <p className="text-sm text-muted-foreground">Affecting car top speed.</p>
      </CardContent>
    </Card>
  );
}
