'use server';

/**
 * @fileOverview An AI tool to suggest optimal pit stop strategies based on race conditions, tire wear, and competitor activity.
 *
 * - suggestPitStopStrategy - A function that suggests pit stop strategies.
 * - PitStopStrategyInput - The input type for the suggestPitStopStrategy function.
 * - PitStopStrategyOutput - The return type for the suggestPitStopStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PitStopStrategyInputSchema = z.object({
  raceConditions: z
    .string()
    .describe('The current race conditions (e.g., dry, wet, mixed).'),
  tireWear: z.string().describe('The current tire wear status (e.g., low, medium, high)'),
  competitorActivity: z
    .string()
    .describe('Information about competitor pit stop activity and strategies.'),
  currentLap: z.number().describe('The current lap number of the race.'),
  lapsRemaining: z.number().describe('The number of laps remaining in the race.'),
});
export type PitStopStrategyInput = z.infer<typeof PitStopStrategyInputSchema>;

const PitStopStrategyOutputSchema = z.object({
  suggestedStrategy: z
    .string()
    .describe('The suggested pit stop strategy based on the input data.'),
  confidenceLevel: z
    .string()
    .describe('The confidence level in the suggested strategy (e.g., high, medium, low).'),
  reasoning: z.string().describe('The reasoning behind the suggested strategy.'),
});
export type PitStopStrategyOutput = z.infer<typeof PitStopStrategyOutputSchema>;

export async function suggestPitStopStrategy(
  input: PitStopStrategyInput
): Promise<PitStopStrategyOutput> {
  return aiPitStopStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPitStopStrategyPrompt',
  input: {schema: PitStopStrategyInputSchema},
  output: {schema: PitStopStrategyOutputSchema},
  prompt: `You are an expert race strategist for a Formula 1 team. Based on the current race conditions, tire wear, competitor activity, current lap and laps remaining, you will suggest an optimal pit stop strategy. Provide a confidence level for your suggestion and explain your reasoning.

Race Conditions: {{{raceConditions}}}
Tire Wear: {{{tireWear}}}
Competitor Activity: {{{competitorActivity}}}
Current Lap: {{{currentLap}}}
Laps Remaining: {{{lapsRemaining}}}

Suggest a pit stop strategy, confidence level, and reasoning.`,
});

const aiPitStopStrategyFlow = ai.defineFlow(
  {
    name: 'aiPitStopStrategyFlow',
    inputSchema: PitStopStrategyInputSchema,
    outputSchema: PitStopStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
