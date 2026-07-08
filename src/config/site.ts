/**
 * Central site configuration.
 * Change the brand name / tagline here and it updates across the whole site.
 */
export const siteConfig = {
  name: "TrainLoop", // placeholder brand — rename anytime
  tagline: "Get paid to train the world's AI.",
  description:
    "TrainLoop connects skilled freelancers with paid projects that train and evaluate AI models. Work from anywhere, on your own schedule.",
  url: "https://example.com",

  // Primary navigation (marketing site)
  nav: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Tasks", href: "/#tasks" },
    { label: "Pay", href: "/#pay" },
    { label: "FAQ", href: "/#faq" },
  ],

  footer: {
    Platform: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Task types", href: "/#tasks" },
      { label: "Pay & payments", href: "/#pay" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    Legal: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Contractor agreement", href: "/contractor-agreement" },
    ],
  },
} as const;
