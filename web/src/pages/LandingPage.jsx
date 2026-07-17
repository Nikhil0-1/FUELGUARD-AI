import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FAQ } from '../components/landing/FAQ';
import { LandingFooter } from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="bg-russian-white min-h-screen text-text-primary overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <FAQ />
      <LandingFooter />
    </div>
  );
}
