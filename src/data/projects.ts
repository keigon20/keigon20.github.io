export interface Project {
  id: string;
  name: string;
  kicker: string;
  tagline: string;
  description: string;
  tags: string[];
  /** CSS gradient used for the placeholder screen until a real screenshot exists. */
  gradient: string;
  /** Path under /public, e.g. "/screens/setly.png". Optional. */
  screenshot?: string;
  caseStudy?: string;
  code?: string;
}

export const projects: Project[] = [
  {
    id: 'setly',
    name: 'Setly',
    kicker: 'Mobile app',
    tagline: 'Your concerts, remembered.',
    description:
      'A social concert journal. Log the shows you go to, add friends, and comment on shared experiences. Built with Expo and Firebase.',
    tags: ['React Native', 'Firebase', 'Authentication'],
    gradient: 'linear-gradient(160deg, #7c3aed 0%, #2563eb 55%, #06b6d4 100%)',
  },
  {
    id: 'titanbuddy',
    name: 'TitanBuddy',
    kicker: 'Social app',
    tagline: 'Campus life, one tap away.',
    description:
      'A social app made for students at Cal State Fullerton, designed around ease of use and performance, with validated input end to end.',
    tags: ['React Expo', 'Firebase', 'Input validation'],
    gradient: 'linear-gradient(160deg, #f97316 0%, #ef4444 55%, #db2777 100%)',
  },
  {
    id: 'golf',
    name: 'Golf Handicap',
    kicker: 'Data app',
    tagline: 'Know your game by the numbers.',
    description:
      'Tracks rounds in a structured database and calculates handicaps following USGA guidelines, so you can see how your game trends over time.',
    tags: ['Python', 'SQL', 'JavaScript'],
    gradient: 'linear-gradient(160deg, #16a34a 0%, #22c55e 50%, #a3e635 100%)',
  },
];

export interface Interest {
  id: string;
  title: string;
  blurb: string;
  glyph: string;
}

export const interests: Interest[] = [
  { id: 'music', title: 'Music & concerts', blurb: 'EDM and country live. Zedd, Kygo, Morgan Wallen, Fly By Midnight.', glyph: '♪' },
  { id: 'baseball', title: 'Baseball & data', blurb: 'Played my whole life. Now I like digging into the numbers. Go Angels.', glyph: '⚾' },
  { id: 'hockey', title: 'Hockey', blurb: 'Anaheim Ducks, home and away.', glyph: '🏒' },
  { id: 'golf', title: 'Golf', blurb: 'Founded the CSUF golf club, and built an app to track my own game.', glyph: '⛳' },
  { id: 'japan', title: '日本', blurb: 'Japanese minor at CSUF, and Okinawan roots I’m proud of.', glyph: '日' },
];

export const site = {
  name: 'Keigo Noguchi',
  email: 'r2keigo@gmail.com',
  location: 'Torrance, CA',
};
