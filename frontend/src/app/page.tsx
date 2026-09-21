"use client";

import React, { useState } from "react";
import { Navbar } from "../components/landing/navbar";
import { HeroSection } from "../components/landing/hero-section";
import { CapabilitiesSection } from "../components/landing/capabilities-section";
import { SecuritySection } from "../components/landing/security-section";
import { ComplianceSection } from "../components/landing/compliance-section";
import { PricingSection } from "../components/landing/pricing-section";
import { ContactSection } from "../components/landing/contact-section";
import { QuicklinksSection } from "../components/landing/quicklinks-section";
import { SearchModal } from "../components/landing/search-modal";
import { Footer } from "../components/ui/footer";
import { AuditReportModal } from "../features/audits/audit-report-modal";
import { SAMPLE_TEMPLATE_SPECIMEN } from "../components/landing/data";

export default function LandingPage() {
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col select-none relative overflow-clip selection:bg-violet-500 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-100px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-[-100px] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      <Navbar
        onSearchOpen={() => setIsSearchModalOpen(true)}
        onScrollToTop={handleScrollToTop}
      />

      <main className="flex-1 w-full">
        <HeroSection onOpenSampleModal={() => setIsSampleModalOpen(true)} />
        <CapabilitiesSection />
        <SecuritySection />
        <ComplianceSection onOpenSampleModal={() => setIsSampleModalOpen(true)} />
        <PricingSection />
        <ContactSection />
        <QuicklinksSection />
      </main>

      <Footer />

      <AuditReportModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        report={SAMPLE_TEMPLATE_SPECIMEN}
        activeRole="supervisor"
        isDemo={true}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
}