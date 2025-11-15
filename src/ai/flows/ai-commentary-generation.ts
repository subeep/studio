'use server';
/**
 * @fileOverview AI-powered commentary generation for F1 races.
 *
 * - generateCommentary - A function that generates commentary about overtakes and leaderboard changes.
 * - CommentaryInput - The input type for the generateCommentary function.
 * - CommentaryOutput - The return type for the generateCommentary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CommentaryInputSchema = z.object({
  raceStateDescription: z
    .string()
    .describe(
      'A detailed description of the current race state, including leaderboard, overtakes, and notable events.'
    ),
});
export type CommentaryInput = z.infer<typeof CommentaryInputSchema>;

const CommentaryOutputSchema = z.object({
  commentary: z.string().describe('The generated commentary about the race.'),
});
export type CommentaryOutput = z.infer<typeof CommentaryOutputSchema>;

export async function generateCommentary(input: CommentaryInput): Promise<CommentaryOutput> {
  return generateCommentaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'commentaryPrompt',
  input: {schema: CommentaryInputSchema},
  output: {schema: CommentaryOutputSchema},
  prompt: `You are a Formula 1 race commentator. Provide real-time commentary about the race based on the following race state description:\n\n{{{raceStateDescription}}}\n\nFocus on overtakes, leaderboard changes, and other exciting events to keep the audience engaged.`,
});

const generateCommentaryFlow = ai.defineFlow(
  {
    name: 'generateCommentaryFlow',
    inputSchema: CommentaryInputSchema,
    outputSchema: CommentaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
