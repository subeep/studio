'use client';

import type { TrackCondition as TrackConditionType } from '@/lib/types';
import { Sun, Cloud, CloudDrizzle, CloudRain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TrackConditionProps {
  condition: TrackConditionType;
}

const conditionInfo = {
  Dry: { icon: Sun, label: 'Dry', description: 'Optimal grip. Slicks recommended.' },
  Damp: { icon: CloudDrizzle, label: 'Damp', description: 'Reduced grip. Tread carefully.' },
  Wet: { icon: Cloud, label: 'Wet', description: 'Low grip. Intermediates advised.' },
  'Very Wet': { icon: CloudRain, label: 'Very Wet', description: 'Very low grip. Full wets required.' },
};

export function TrackCondition({ condition }: TrackConditionProps) {
  const { icon: Icon, label, description } = conditionInfo[condition];

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            Track Condition
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
         <p className="text-2xl font-bold">{label}</p>
         <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
