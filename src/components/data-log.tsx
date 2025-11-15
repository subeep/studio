'use client';

import type { LogEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DataLogProps {
  log: LogEntry[];
}

export function DataLog({ log }: DataLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookText className="text-primary" />
          Live Data Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          {log.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Waiting for driver data...</p>
          ) : (
            <div className="flex flex-col-reverse p-4 font-mono text-sm">
              {log.map((entry) => (
                <div key={entry.timestamp} className="grid grid-cols-4 gap-2 border-b py-1">
                  <span className="text-muted-foreground">{formatDistanceToNow(entry.timestamp, { addSuffix: true })}</span>
                  <span>Lap: {entry.lap}</span>
                  <span>Spd: {entry.speed.toFixed(0)}</span>
                  <span>Fuel: {entry.fuel.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
