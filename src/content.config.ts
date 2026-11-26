import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().min(30).max(62),
    description: z.string(),
    seoDescription: z.string().min(110).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Cristian Pufu"),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).min(3),
    readingMinutes: z.number().int().positive(),
    relatedSlug: z.string().optional(),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional(),
    howTo: z
      .object({
        name: z.string(),
        description: z.string(),
        totalTime: z.string().optional(),
        steps: z
          .array(
            z.object({
              name: z.string(),
              text: z.string(),
            }),
          )
          .min(2),
      })
      .optional(),
  }),
});

export const collections = { blog };
