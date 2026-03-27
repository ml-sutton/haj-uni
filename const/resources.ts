export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "Crisis support" | "Medical information" | "Community";
};

export const RESOURCES: ResourceItem[] = [
  {
    id: "trevor",
    title: "The Trevor Project",
    description: "24/7 crisis support for LGBTQ+ young people.",
    url: "https://www.thetrevorproject.org/",
    category: "Crisis support",
  },
  {
    id: "translifeline",
    title: "Trans Lifeline",
    description: "Peer support hotline run by and for trans people.",
    url: "https://translifeline.org/",
    category: "Crisis support",
  },
  {
    id: "plannedparenthood",
    title: "Planned Parenthood",
    description: "Gender-affirming care information and clinic resources.",
    url: "https://www.plannedparenthood.org/",
    category: "Medical information",
  },
  {
    id: "wpath",
    title: "WPATH",
    description: "Standards of care and professional guidance resources.",
    url: "https://www.wpath.org/",
    category: "Medical information",
  },
  {
    id: "reddit-transgenderau",
    title: "r/transgenderau",
    description: "Community discussion focused on trans experiences in Australia.",
    url: "https://www.reddit.com/r/transgenderau/",
    category: "Community",
  },
];
