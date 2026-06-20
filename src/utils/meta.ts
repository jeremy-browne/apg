import { extractPlainText } from "emdash";
import { getReadingTime } from "./readingTime";
import type { WithMeta } from "../types";
import type { PortableTextBlock } from "emdash";

export function attachMeta<T extends { data: { content?: PortableTextBlock[] } }>(
  post: T,
): WithMeta<T> {
  const plainText = post.data.content ? extractPlainText(post.data.content) : "";
  const readingTime = plainText ? getReadingTime(plainText) : undefined;

  return {
    ...post,
    meta: {
      readingTimeText: readingTime?.text ?? "",
    },
  };
}
