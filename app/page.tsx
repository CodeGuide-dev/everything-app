import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HeroSection, FeaturesSection, PricingSection } from "@/components/landing";
import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <section className="bg-background py-24">
        <div className="container mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border bg-muted/40 p-10 text-center shadow-sm">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to launch your AI workspace?
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Spin up everything-app in minutes, connect your data sources, and ship intelligent assistants that your team will love.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href="/sign-up">
                Create free account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/docs">View documentation</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
