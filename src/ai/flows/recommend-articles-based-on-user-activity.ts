'use server';
/**
 * @fileOverview Recommends articles based on user activity.
 *
 * - recommendArticlesBasedOnUserActivity - A function that recommends articles based on user activity.
 * - RecommendArticlesBasedOnUserActivityInput - The input type for the recommendArticlesBasedOnUserActivity function.
 * - RecommendArticlesBasedOnUserActivityOutput - The return type for the recommendArticlesBasedOnUserActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendArticlesBasedOnUserActivityInputSchema = z.object({
  recentActivity: z
    .string()
    .describe('The recent activity of the user, such as viewed articles and categories.'),
  availableArticles: z
    .string()
    .describe('A list of available articles with their titles and categories.'),
});
export type RecommendArticlesBasedOnUserActivityInput = z.infer<
  typeof RecommendArticlesBasedOnUserActivityInputSchema
>;

const RecommendArticlesBasedOnUserActivityOutputSchema = z.object({
  recommendedArticles: z
    .string()
    .describe('A list of recommended articles based on the user activity.'),
});
export type RecommendArticlesBasedOnUserActivityOutput = z.infer<
  typeof RecommendArticlesBasedOnUserActivityOutputSchema
>;

export async function recommendArticlesBasedOnUserActivity(
  input: RecommendArticlesBasedOnUserActivityInput
): Promise<RecommendArticlesBasedOnUserActivityOutput> {
  return recommendArticlesBasedOnUserActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendArticlesBasedOnUserActivityPrompt',
  input: {schema: RecommendArticlesBasedOnUserActivityInputSchema},
  output: {schema: RecommendArticlesBasedOnUserActivityOutputSchema},
  prompt: `You are an expert magazine content recommender.

  Based on the user's recent activity and the available articles, recommend articles that the user might be interested in.

  Recent Activity: {{{recentActivity}}}
  Available Articles: {{{availableArticles}}}

  Recommended Articles:`,
});

const recommendArticlesBasedOnUserActivityFlow = ai.defineFlow(
  {
    name: 'recommendArticlesBasedOnUserActivityFlow',
    inputSchema: RecommendArticlesBasedOnUserActivityInputSchema,
    outputSchema: RecommendArticlesBasedOnUserActivityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
