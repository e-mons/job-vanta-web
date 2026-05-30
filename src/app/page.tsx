import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import TrustedCompanies from '@/components/landing/TrustedCompanies';
import HowItWorks from '@/components/landing/HowItWorks';
import ProductDemonstration from '@/components/landing/ProductDemonstration';
import AIFeatures from '@/components/landing/AIFeatures';
import Templates from '@/components/landing/Templates';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import CompetitorComparison from '@/components/landing/CompetitorComparison';
import TrustAndSecurity from '@/components/landing/TrustAndSecurity';
import UserResumes from '@/components/landing/UserResumes';
import SavedJobs from '@/components/landing/SavedJobs';
import SuccessStories from '@/components/landing/SuccessStories';
import CompanyAndTeam from '@/components/landing/CompanyAndTeam';
import MobilePromo from '@/components/landing/MobilePromo';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  return (
    <main className="min-h-screen bg-white selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar user={user} />
      <Hero />
      <TrustedCompanies />
      <HowItWorks />
      <ProductDemonstration />
      <AIFeatures />
      <Templates />
      <WhyChooseUs />
      <CompetitorComparison />
      <TrustAndSecurity />
      
      {/* Dashboard Section for Authenticated Users */}
      {user && (
        <section className="bg-slate-50 py-24 relative overflow-hidden">
          {/* Decorative Blur */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-4">
                Personal Workspace
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome back!</h2>
              <p className="text-base text-slate-500 font-medium">Pick up where you left off with your career progress.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <UserResumes />
              <SavedJobs />
            </div>
          </div>
        </section>
      )}
      

      <SuccessStories />
      <CompanyAndTeam />
      <MobilePromo />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
