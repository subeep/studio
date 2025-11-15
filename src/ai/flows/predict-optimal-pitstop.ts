'use server';

/**
 * @fileOverview An AI tool to predict the optimal pit stop lap.
 *
 * - predictOptimalPitStop - A function that predicts the optimal pit stop lap.
 * - PredictOptimalPitStopInput - The input type for the predictOptimalPitStop function.
 * - PredictOptimalPitStopOutput - The return type for the predictOptimalPitStop function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictOptimalPitStopInputSchema = z.object({
  tireWear: z.number().describe('The current tire wear percentage (0-100).'),
  pitStops: z.number().describe('The number of pit stops already taken.'),
  currentLap: z.number().describe('The current lap number.'),
  totalLaps: z.number().describe('The total number of laps in the race.'),
  tireCompound: z.string().describe('The current tire compound (Soft, Medium, Hard).')
});
export type PredictOptimalPitStopInput = z.infer<typeof PredictOptimalPitStopInputSchema>;

const PredictOptimalPitStopOutputSchema = z.object({
  predictedLap: z.number().optional().describe('The predicted optimal lap number for the next pit stop. Null if no pit stop is recommended.'),
  reasoning: z.string().describe('The reasoning behind the prediction.'),
});
export type PredictOptimalPitStopOutput = z.infer<typeof PredictOptimalPitStopOutputSchema>;

export async function predictOptimalPitStop(
  input: PredictOptimalPitStopInput
): Promise<PredictOptimalPitStopOutput> {
  return predictOptimalPitStopFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictOptimalPitStopPrompt',
  input: {schema: PredictOptimalPitStopInputSchema},
  output: {schema: PredictOptimalPitStopOutputSchema},
  prompt: `You are a Formula 1 race strategist. Based on the data below, predict the optimal lap for the next pit stop.

- Current Lap: {{{currentLap}}} of {{{totalLaps}}}
- Tire Compound: {{{tireCompound}}}
- Tire Wear: {{{tireWear}}}%
- Pit Stops Taken: {{{pitStops}}}

Your primary goal is to balance tire performance and track position.
- Soft tires are fastest but wear quickly (ideal wear < 60%).
- Medium tires are a balance (ideal wear < 75%).
- Hard tires are slowest but most durable (ideal wear < 90%).

If the driver has already made 3 or more pit stops, it's highly unlikely another stop is optimal unless there's damage or extreme wear. In that case, state that no further pit stops are recommended. Otherwise, provide a predicted lap and a brief reasoning.`,
});

const predictOptimalPitStopFlow = ai.defineFlow(
  {
    name: 'predictOptimalPitStopFlow',
    inputSchema: PredictOptimalPitStopInputSchema,
    outputSchema: PredictOptimalPitStopOutputSchema,
  },
  async input => {
    // If 3 or more pit stops have been made, it's almost never optimal to pit again.
    if (input.pitStops >= 3) {
      return {
        reasoning: "With 3 pit stops already taken, another stop is not recommended under normal conditions.",
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
