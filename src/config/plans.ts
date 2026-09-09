import { Shield, Zap, Crown } from 'lucide-react';
import React from 'react';

export interface PlanFeature {
  text: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  priceId: string | null;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  iconName: 'Shield' | 'Zap' | 'Crown';
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    priceId: null,
    description: 'Essential tools to kickstart your career search',
    features: [
      '1 Resume / CV max',
      '2 AI Job Applies / day',
      'No Prepare Me (AI Q&A) access',
      '25+ Verified Job Search Results',
      'Basic Email Support'
    ],
    cta: 'Get Started Free',
    href: '/signup',
    highlighted: false,
    iconName: 'Shield'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29',
    priceId: 'pdt_0Newfu26VwAPCKJBoT8z5',
    description: 'Most popular for active job seekers landing roles fast',
    features: [
      '5 Resumes / CVs max',
      '25 AI Job Applies / day',
      'Prepare Me: Job-Specific AI Q&A Unlocked',
      'Risk Radar & Factual Truth Lock',
      '45+ Verified Job Search Results',
      'Priority Email & Chat Support'
    ],
    cta: 'Get Started Pro',
    href: '/signup?plan=pro',
    highlighted: true,
    iconName: 'Zap'
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '99',
    priceId: 'pdt_0NewgKeXYMkBEofXpxy9Z',
    description: 'Complete career acceleration with zero restrictions',
    features: [
      'Unlimited Resumes / CVs',
      'Unlimited AI Job Applies / day',
      'Prepare Me: Job-Specific AI Q&A Unlocked',
      'Voice Practice & STAR Delivery Scoring',
      'Unlimited Job Searches & Results',
      '24/7 Priority Support & Career Mentorship'
    ],
    cta: 'Go Unlimited',
    href: '/signup?plan=unlimited',
    highlighted: false,
    iconName: 'Crown'
  }
];
