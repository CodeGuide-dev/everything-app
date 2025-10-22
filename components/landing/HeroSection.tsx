import Link from "next/link";
import { MoveRight, PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FlipWords } from "@/components/ui/flip-words";
import { AuroraBackground } from "@/components/ui/aurora-background";

const heroHighlights = [
  { label: "AI-native", value: "Chat, search, automation" },
  { label: "Secure", value: "SOC2-ready security" },
  { label: "Flexible", value: "BYOK or hosted" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b">
      <AuroraBackground className="py-16 lg:py-20">
        <div className="container relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
          <Button size="sm" variant="secondary" className="gap-2">
            Read our launch article <MoveRight className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">Build workflows that span</span>
              <span className="block">
                <FlipWords
                  words={["chat", "knowledge", "automations"]}
                  duration={2200}
                />
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              everything-app is the unified surface for teams to explore data, collaborate with AI, and launch intelligent experiences in minutes.
            </p>
          </div>
          <div className="flex flex-row flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="mailto:hello@everything.app?subject=Schedule%20a%20call">
                Jump on a call
                <PhoneCall className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/sign-up">
                Sign up here
                <MoveRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
          {/* <dl className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <div key={item.label} className="rounded-xl border bg-background/80 p-6 text-left backdrop-blur">
                <dt className="text-sm uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-2 text-lg font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl> */}
        </div>
      </AuroraBackground>
    </section>
  );
}
