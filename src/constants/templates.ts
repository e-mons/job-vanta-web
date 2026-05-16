export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Professional' | 'Creative' | 'Corporate' | 'Tech' | 'Executive' | 'Minimal';
  image: string;
  rating: number;
  uses: string;
  premium: boolean;
  tag?: string;
}

export const CATEGORIES = ['All', 'Professional', 'Creative', 'Corporate', 'Tech', 'Executive', 'Minimal'] as const;

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean, professional, and optimized for ATS systems.',
    category: 'Professional',
    image: '/assets/template_modern.png',
    rating: 4.9,
    uses: '12k+',
    premium: false,
    tag: 'Popular'
  },
  {
    id: 'executive',
    name: 'Executive Gold',
    description: 'Elegant and distinguished for senior positions.',
    category: 'Executive',
    image: '/assets/template_executive.png',
    rating: 5.0,
    uses: '8k+',
    premium: false,
    tag: 'Elite'
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Stand out with a vibrant and dynamic layout.',
    category: 'Creative',
    image: '/assets/template_creative.png',
    rating: 4.8,
    uses: '15k+',
    premium: false,
    tag: 'Visual'
  },
  {
    id: 'minimalist',
    name: 'Minimalist Elite',
    description: 'Simple, highly readable, and straight to the point.',
    category: 'Minimal',
    image: '/assets/template_minimalist.png',
    rating: 4.9,
    uses: '20k+',
    premium: false,
    tag: 'Clean'
  },
  {
    id: 'corporate',
    name: 'Corporate Classic',
    description: 'Traditional corporate layout for business professionals.',
    category: 'Corporate',
    image: '/assets/template_corporate.png',
    rating: 4.8,
    uses: '9.2k+',
    premium: false,
    tag: 'Safe'
  },
  {
    id: 'techpro',
    name: 'Tech Pro',
    description: 'Built for developers, engineers, and IT professionals.',
    category: 'Tech',
    image: '/assets/template_techpro.png',
    rating: 4.9,
    uses: '11k+',
    premium: false,
    tag: 'Modern'
  },
  {
    id: 'elegant',
    name: 'Elegant Serif',
    description: 'Sophisticated serif typography for high-end roles.',
    category: 'Executive',
    image: '/assets/template_elegant.png',
    rating: 5.0,
    uses: '5.4k+',
    premium: true,
    tag: 'Premium'
  },
  {
    id: 'bold',
    name: 'Bold Impact',
    description: 'Results-driven design that commands attention.',
    category: 'Creative',
    image: '/assets/template_bold.png',
    rating: 4.7,
    uses: '7.8k+',
    premium: true,
    tag: 'Impact'
  },
  {
    id: 'clean',
    name: 'Clean Slate',
    description: 'Apple-inspired ultra-clean aesthetic with max whitespace.',
    category: 'Minimal',
    image: '/assets/template_clean.png',
    rating: 4.9,
    uses: '6.7k+',
    premium: true,
    tag: 'Ultra'
  },
  {
    id: 'professional_dark',
    name: 'Professional Dark',
    description: 'Modern dark header with striking contrast and polish.',
    category: 'Professional',
    image: '/assets/template_professional_dark.png',
    rating: 4.8,
    uses: '4.5k+',
    premium: true,
    tag: 'Bold'
  },
];
