'use client';

import type { Weather } from '@/lib/types';
import { Sun, Cloud, CloudRain } from 'lucide-react';
import React from 'react';

interface WeatherDisplayProps {
  weather: Weather;
}

const weatherInfo = {
  Dry: { icon: Sun, label: 'Dry' },
  'Light Rain': { icon: Cloud, label: 'Light Rain' },
  'Heavy Rain': { icon: CloudRain, label: 'Heavy Rain' },
};

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
  const { icon: Icon, label } = weatherInfo[weather];

  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}
