import type { Metadata } from "next";
import "@/features/landing/landing.css";
import { AboutSection } from "@/features/landing/components/about-section";
import { ContactSection } from "@/features/landing/components/contact-section";
import { FeaturesGrid } from "@/features/landing/components/features-grid";
import { Hero } from "@/features/landing/components/hero";
import { HowItWorks } from "@/features/landing/components/how-it-works";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { NavActions } from "@/features/landing/components/landing-actions";
import { MarqueeBand } from "@/features/landing/components/marquee-band";
import { SiteFooter } from "@/features/landing/components/site-footer";

export const metadata: Metadata = {
  title: "Scroll to Spark: one small thing, then a real thank-you",
  description:
    "When the news feels heavy, pick one small, real way to help your community. A real group writes back to say thanks.",
};

/** The public home page. Signed-out visitors see it at "/"; the proxy rewrites "/" here for them. */
export default function WelcomePage() {
  return (
    <div className="landing-root">
      <LandingHeader actions={<NavActions />} />
      <main>
        <Hero />
        <MarqueeBand />
        <HowItWorks />
        <FeaturesGrid />
        <AboutSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
