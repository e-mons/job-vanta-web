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
    description: 'Perfect for exploring the platform',
    features: [
      'ATS-Friendly Resume Builder',
      'Limited AI Suggestions',
      'Job Search & Matching',
      '3 Saved Resumes',
      'Basic Support'
    ],
    cta: 'Start for Free',
    href: '/signup',
    highlighted: false,
    iconName: 'Shield'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29',
    priceId: 'pdt_0Newfu26VwAPCKJBoT8z5',
    description: 'Most popular for active job seekers',
    features: [
      'Everything in Free',
      'Unlimited AI Resume Optimization',
      'Priority Job Matching',
      'Unlimited Resume Storage',
      'Priority Email Support',
      'Advanced Career Insights'
    ],
    cta: 'Get Started Pro',
    href: '/signup?plan=pro',
    highlighted: true,
    iconName: 'Zap'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '99',
    priceId: 'pdt_0NewgKeXYMkBEofXpxy9Z',
    description: 'Executive-level career management',
    features: [
      'Everything in Pro',
      'Dedicated Career Coach (AI)',
      'Portfolio Website Builder',
      'Direct Recruiter Network',
      '24/7 Premium Support',
      'Interview Coaching (AI Video)'
    ],
    cta: 'Go Enterprise',
    href: '/signup?plan=enterprise',
    highlighted: false,
    iconName: 'Crown'
  }
];
