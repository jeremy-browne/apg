export const SITE_SETTINGS = {
  title: "Aussie Pilot Guide",
  description:
    "The Australian flight training blog we wish we'd had as a student pilot. Honest takes on theory, lessons, exams, and life learning to fly.",
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
        name: "Authors",
        url: "/authors",
      },
      {
        name: "Search",
        url: "/search",
      },
      {
        name: "Contact",
        url: "/contact",
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
