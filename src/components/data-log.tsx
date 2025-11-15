'use client';

import type { LogEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookText, User, ChevronsRight, Thermometer, Wind } from 'lucide-react';
import { format } from 'date-fns';

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
        <ScrollArea className="h-64">
          {log.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Waiting for race data...</p>
          ) : (
            <div className="flex flex-col-reverse p-2 font-mono text-xs">
              {log.map((entry, index) => (
                <div key={index} className="grid grid-cols-[50px_1fr] gap-x-2 border-b py-1.5 last:border-none">
                  <span className="text-muted-foreground">{format(entry.timestamp, 'HH:mm:ss')}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className="font-semibold text-primary">{entry.carName}</span>
                       <span>(P{entry.position})</span>
                    </div>
                     <span className='truncate'>{entry.message}</span>
                     <div className="flex items-center gap-4 text-muted-foreground">
                        <span>Lap: {entry.lap}</span>
                        <span>Spd: {entry.speed.toFixed(0)}</span>
                        <span>Tire: {entry.tire}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
