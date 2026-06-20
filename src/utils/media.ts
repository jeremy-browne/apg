// Resolve an emdash media field value to a usable URL.
//
// emdash stores a media field as a reference — `{ id, provider, meta: { storageKey } }` —
// and only populates `src` in some cases. For local (R2/disk) media the public file is
// served at `/_emdash/api/media/file/<storageKey>`, so derive that when `src` is absent.

interface EmDashMedia {
  src?: string;
  id?: string;
  provider?: string;
  meta?: { storageKey?: string } | null;
}

const MEDIA_FILE_PREFIX = "/_emdash/api/media/file/";

export function mediaUrl(media?: EmDashMedia | null): string | undefined {
  if (!media) return undefined;
  // Already a usable URL (absolute path or external).
  if (media.src && (media.src.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(media.src))) {
    return media.src;
  }
  const key = media.meta?.storageKey ?? media.src;
  return key ? `${MEDIA_FILE_PREFIX}${key}` : undefined;
}
