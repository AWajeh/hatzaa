import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Professions } from "@/components/landing/professions";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Professions />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}
