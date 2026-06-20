// Shared rendering for the emdash-backed search UI (modal + /search page).

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Render results into a <ul>, toggling an "empty" message element.
// `snippet` is already HTML-escaped by emdash (with <mark> highlights), so it
// is set via innerHTML; `title` is plain text and set via textContent.
export function renderResults(
  list: HTMLElement,
  empty: HTMLElement,
  items: SearchResult[],
): void {
  list.replaceChildren();

  if (!items || items.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  for (const item of items) {
    const li = document.createElement("li");

    const a = document.createElement("a");
    a.href = item.url;
    a.className =
      "block rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800";

    const title = document.createElement("div");
    title.className = "font-medium";
    title.textContent = item.title;

    const snippet = document.createElement("div");
    snippet.className =
      "mt-0.5 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400 [&_mark]:bg-yellow-200 [&_mark]:text-inherit dark:[&_mark]:bg-yellow-500/30";
    snippet.innerHTML = item.snippet;

    a.append(title, snippet);
    li.append(a);
    list.append(li);
  }
}
