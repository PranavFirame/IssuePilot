"use client";

import * as React from "react";
import { Navbar } from "@/components/navbar";
import { HeroSearch } from "@/components/landing/hero-search";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { WorkflowPreview } from "@/components/landing/workflow-preview";
import { SecuritySection } from "@/components/landing/security-section";
import { Footer } from "@/components/footer";
import { SavedReportsModal } from "@/components/reports/saved-reports-modal";

export default function HomePage() {
  const [isSavedReportsOpen, setIsSavedReportsOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar onOpenSavedReports={() => setIsSavedReportsOpen(true)} />

      <main className="flex-1">
        <HeroSearch />
        <FeatureGrid />
        <WorkflowPreview />
        <SecuritySection />
      </main>

      <Footer />

      <SavedReportsModal
        isOpen={isSavedReportsOpen}
        onClose={() => setIsSavedReportsOpen(false)}
      />
    </div>
  );
}
