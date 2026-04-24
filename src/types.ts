import type { CollectionEntry } from "astro:content";

export type SiteSettings = {};

export type ContentEntry = CollectionEntry<"blog">;

export type AllContentEntry =
  | CollectionEntry<"blog">
  | CollectionEntry<"legal">;

export type ContentCollections = "blog" | "legal";

export interface PostMeta {
  plainText: string;
  readingTimeText: string;
}

export type WithMeta<T> = T & { meta: PostMeta };

export type ImageLoading = "eager" | "lazy" | null;
