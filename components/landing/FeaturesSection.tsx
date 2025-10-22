import { ReactNode } from "react";
import {
  Bot,
  ShieldCheck,
  Workflow,
  Search,
  Globe,
  Database,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
};

const features: Feature[] = [
  {
    title: "Conversational AI workspaces",
    description:
      "Launch domain-specific chat agents that know your docs, databases, and internal tools without leaving the dashboard.",
    icon: <Bot className="h-6 w-6" />,
    badge: "Chat",
  },
  {
    title: "Unified search & retrieval",
    description:
      "Blend semantic, keyword, and vector search to surface the exact insight across knowledge bases, tickets, and data lakes.",
    icon: <Search className="h-6 w-6" />,
    badge: "Knowledge",
  },
  {
    title: "Secure by default",
    description:
      "SOC2-ready architecture with granular role controls, audit logging, regional data residency, and zero data retention options.",
    icon: <ShieldCheck className="h-6 w-6" />,
    badge: "Security",
  },
  {
    title: "Automations engine",
    description:
      "Trigger multi-step workflows that call APIs, update CRMs, and sync notes back to your stack in a single flow.",
    icon: <Workflow className="h-6 w-6" />,
    badge: "Automation",
  },
  {
    title: "Connected data fabric",
    description:
      "Connect warehouses, knowledge bases, and live APIs. Keep everything in sync with streaming ingestion and vector pipelines.",
    icon: <Database className="h-6 w-6" />,
  },
  {
    title: "Enterprise readiness",
    description:
      "SSO/SAML, SCIM provisioning, custom data retention, and dedicated support to meet the needs of fast-scaling teams.",
    icon: <Globe className="h-6 w-6" />,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="container mx-auto max-w-5xl space-y-8 py-24">
      <div className="text-center">
        <Badge variant="secondary" className="px-4 py-1 text-sm">Why teams choose everything-app</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Built for product, operations, and AI teams
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Opinionated defaults plus flexible building blocks let you move from prototype to production without rewrites.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="border-border/60 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {feature.icon}
              </div>
              {feature.badge ? (
                <Badge variant="outline" className="self-start">
                  {feature.badge}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
