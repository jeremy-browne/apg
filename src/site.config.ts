export const SITE_SETTINGS = {
  title: "Aussie Pilot Guide",
  description:
    "A pilot training blog covering Australian aviation — theory, training flights, exams, and life as a student pilot.",
  owner: "APG",
  ogImages: "",
  socials: [] as { icon: string; label: string; url: string; handle: string }[],
};

export const header = [
  {
    name: "Blog",
    url: "/blog",
  },
  {
    name: "About",
    url: "/about",
  },
];

export const footer = [
  {
    title: "Content",
    links: [
      {
        name: "Blog",
        url: "/blog",
      },
      {
        name: "About",
        url: "/about",
      },
      {
        name: "Search",
        url: "/search",
      },
    ],
  },
  {
    title: "More",
    links: [
      {
        name: "RSS",
        url: "/rss.xml",
      },
      {
        name: "Sitemap",
        url: "/sitemap-index.xml",
      },
    ],
  },
];
