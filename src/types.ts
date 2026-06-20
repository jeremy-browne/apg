import type { ContentEntry as EmDashEntry } from "emdash";
import type { CollectionEntry } from "astro:content";
import type { Post } from "../emdash-env";

export type SiteSettings = {};

export type ContentEntry = EmDashEntry<Post>;

export type AllContentEntry =
  | EmDashEntry<Post>
  | CollectionEntry<"legal">;

export type ContentCollections = "posts" | "legal";

export interface PostMeta {
  readingTimeText: string;
}

export type WithMeta<T> = T & { meta: PostMeta };

export type ImageLoading = "eager" | "lazy" | null;
