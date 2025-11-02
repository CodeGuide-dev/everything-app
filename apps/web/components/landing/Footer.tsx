import Link from "next/link";

type FooterSection = {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
};

const footerLinks: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Docs", href: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "https://everything.app/blog", external: true },
      { label: "Changelog", href: "https://everything.app/changelog", external: true },
      { label: "Careers", href: "https://everything.app/careers", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Support", href: "mailto:help@everything.app", external: true },
      { label: "Status", href: "https://status.everything.app", external: true },
      { label: "Security", href: "https://everything.app/security", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-background py-16">
      <div className="container mx-auto flex max-w-5xl flex-col gap-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-4">
            <Link href="/" className="text-xl font-semibold">
              everything-app
            </Link>
            <p className="text-sm text-muted-foreground">
              Operational AI for the modern enterprise. Bring chat, knowledge, and automations together to ship faster.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3"
          >
            {footerLinks.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((item) => (
                    <li key={item.label}>
                      {item.external ? (
                        <a
                          href={item.href}
                          className="transition-colors hover:text-primary"
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="transition-colors hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} everything-app. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/security" className="transition-colors hover:text-primary">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
