// Work history shown by the About page's [SHOW_EXPERIENCE] card, newest first
export interface ExperienceRole {
  title: string;
  company: string;
  location: string;
  duration: string;
  bullets: string[];
}

export const experience: ExperienceRole[] = [
  {
    title: 'Senior Software Engineer, Agentic AI',
    company: 'Nasdaq (Verafin)',
    location: "St. John's, NL",
    duration: 'May 2026 – Present',
    bullets: [
      'Architect an end-to-end pipeline for building and deploying AI agents',
      'Build BSA/AML case-review agents on AWS Bedrock AgentCore',
      'Halved a production agent’s latency while improving specificity and recall',
      'Ship infra that lets developers deploy agents with tools and skills',
    ],
  },
  {
    title: 'Generative AI Associate',
    company: 'Innodata Inc.',
    location: 'Toronto, ON',
    duration: 'Aug 2025 – May 2026',
    bullets: [
      'Evaluated and rated model outputs for Meta on quality and accuracy',
      'Contributed to open-source Redlite for toxicity and benchmark testing',
      'Collected and augmented datasets to reduce model overfitting',
    ],
  },
];
