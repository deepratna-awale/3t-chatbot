// Degrees shown by the About page's [SHOW_EDUCATION] card, newest first
export interface Degree {
  degree: string;
  school: string;
  location: string;
  duration: string;
  bullets: string[];
}

export const education: Degree[] = [
  {
    degree: 'MASc, Computer Engineering',
    school: 'Memorial University of Newfoundland',
    location: "St. John's, NL",
    duration: '2024',
    bullets: [
      'Thesis: hybrid CNN + MLP model that estimates ocean wave height',
      'Trained and evaluated on Wamos II marine radar images',
    ],
  },
  {
    degree: 'BEng, Information Technology',
    school: 'RGCER, Nagpur',
    location: 'Nagpur, India',
    duration: '2021',
    bullets: [
      'Published Semantic Analysis of Long Answers (IRJCS, 2021)',
      'Co-authored T.A.E.S, an automated answer-scoring system (IJSRP, 2022)',
      'Earned IBM Data Science and IIT Madras Python DSA certificates',
    ],
  },
];
