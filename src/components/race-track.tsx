'use client';

import type { Car, Track } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RaceTrackProps {
  cars: Car[];
  track: Track;
}

export function RaceTrack({ cars, track }: RaceTrackProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [track.path]);

  const getCoords = (progress: number) => {
    if (!pathRef.current || pathLength === 0 || progress === undefined) {
      return { x: 0, y: 0 };
    }
    const distance = (progress / 100) * pathLength;
    return pathRef.current.getPointAtLength(distance);
  };
  
  return (
    <TooltipProvider>
      <div className="relative aspect-[16/9] w-full">
        <svg viewBox="0 0 600 500" className="h-full w-full">
          <defs>
            <linearGradient id="drsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path
            ref={pathRef}
            d={track.path}
            stroke="hsl(var(--border))"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* DRS Zones */}
          {track.drsZones.map((zone, index) => {
            if (!pathRef.current || pathLength === 0) return null;
            const startPoint = getCoords(zone.start * 100);
            const endPoint = getCoords(zone.end * 100);
            const length = pathLength * (zone.end - zone.start);

            // This is a simplified representation. A real implementation would trace the path segment.
            return (
              <React.Fragment key={`drs-${index}`}>
                 <path
                  d={track.path}
                  stroke="url(#drsGradient)"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${pathLength * zone.start} ${length} ${pathLength}`}
                />
                <circle cx={startPoint.x} cy={startPoint.y} r="10" fill="hsl(var(--primary))" opacity="0.5" />
                 <foreignObject x={startPoint.x-10} y={startPoint.y-35} width="20" height="20">
                     <Zap className="h-5 w-5 text-primary-foreground fill-primary" />
                 </foreignObject>
              </React.Fragment>
            );
          })}


          {cars.map((car) => {
            const { x, y } = getCoords(car.progress);
            if (x === 0 && y === 0) return null;
            
            return (
              <Tooltip key={car.driver.id}>
                <TooltipTrigger asChild>
                  <g transform={`translate(${x}, ${y})`}>
                    <circle
                      r="12"
                      fill={car.driver.color}
                      stroke="hsl(var(--background))"
                      strokeWidth="2"
                      className={cn(
                        "transition-transform duration-1000 ease-linear",
                        { 'animate-pulse': car.isPitting }
                      )}
                    />
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      className="text-[9px] font-bold"
                      fill="#fff"
                      stroke="#000"
                      strokeWidth="0.5px"
                      strokeLinejoin="round"
                    >
                      {car.position}
                    </text>
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">{car.driver.tricode} - {car.driver.name}</p>
                  <p>Speed: {car.speed.toFixed(0)} km/h</p>
                  <p>Tire: {car.tire} ({car.tireWear.toFixed(0)}%)</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </svg>
      </div>
    </TooltipProvider>
  );
}
