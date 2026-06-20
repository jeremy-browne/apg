import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().optional(),
});

const ogImageOptionalSchema = z
  .union([imageSchema, z.object({}).strict()])
  .optional()
  .nullable()
  .transform((v) => (v && "src" in v ? v : undefined));

const licenses = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/licenses" }),
  schema: z.object({
    name: z.string().min(1, { message: "License Name cannot be empty." }),
    description: z.string().optional(),
    url: z.string().url(),
    type: z.enum(["post", "project"]),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    lastUpdated: z.coerce.date(),
    ogImage: ogImageOptionalSchema,
  }),
});

const about = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/about" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: ogImageOptionalSchema,
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/authors" }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    image: imageSchema.optional(),
  }),
});

export const collections = {
  licenses,
  legal,
  about,
  authors,
};
