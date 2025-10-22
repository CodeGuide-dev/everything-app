import Link from "next/link";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  highlights: string[];
  cta: {
    label: string;
    href: string;
    variant?: "default" | "outline";
    external?: boolean;
  };
  badge?: string;
};

const pricingPlans: PricingPlan[] = [
  {
    name: "Free / BYOK",
    price: "$0",
    cadence: "bring-your-own-key",
    description: "Open source deployment for self-hosted teams that want full control over infrastructure.",
    highlights: [
      "Unlimited chat history",
      "Self-managed infrastructure",
      "Vector sync connectors",
      "Community support",
    ],
    cta: {
      label: "Deploy from GitHub",
      href: "https://github.com/",
      variant: "outline",
      external: true,
    },
  },
  {
    name: "Growth",
    price: "$20",
    cadence: "per user / month",
    description: "Fully hosted, AI-ready workspace with secure storage, governance, and automation features included.",
    highlights: [
      "Hosted vector storage",
      "Unlimited automations",
      "Role-based access control",
      "Priority email support",
    ],
    cta: { label: "Start free trial", href: "/sign-up" },
    badge: "Most popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual agreements",
    description: "Tailored deployments with dedicated support, custom SLAs, and enterprise-grade compliance tooling.",
    highlights: [
      "Dedicated success manager",
      "SOC2 & GDPR alignment",
      "SSO/SAML & SCIM",
      "Private cloud or on-prem",
    ],
    cta: {
      label: "Contact sales",
      href: "mailto:hello@everything.app?subject=Enterprise%20plan",
      variant: "outline",
      external: true,
    },
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-y bg-muted/30 py-24">
      <div className="container mx-auto flex max-w-5xl flex-col gap-12">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="px-4 py-1 text-sm">Flexible options for every team</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose how you launch everything-app
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Start for free, scale as your AI footprint grows, or partner with us for bespoke enterprise deployments.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col justify-between border-border/50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                plan.badge ? "border-primary/60" : ""
              }`}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                  {plan.badge ? <Badge>{plan.badge}</Badge> : null}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {plan.description}
                </CardDescription>
                <div>
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{plan.cadence}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-left">
                      <Check className="mt-1 h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  variant={plan.cta.variant ?? "default"}
                  className="w-full"
                >
                  {plan.cta.external ? (
                    <a
                      href={plan.cta.href}
                      target={plan.cta.href.startsWith("http") ? "_blank" : undefined}
                      rel={plan.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {plan.cta.label}
                    </a>
                  ) : (
                    <Link href={plan.cta.href}>{plan.cta.label}</Link>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
