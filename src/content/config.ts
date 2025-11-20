import { defineCollection, z } from 'astro:content';

const dailyMessages = defineCollection({
  type: 'content', // MDXファイルを使います
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    youtubeId: z.string(), // YouTubeの動画ID (例: "dQw4w9WgXcQ")
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(), // サムネイル画像があれば
  }),
});

export const collections = {
  'daily-messages': dailyMessages,
};