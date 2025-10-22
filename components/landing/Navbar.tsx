"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";

const marketingLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6"
    >
      {marketingLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          onClick={onNavigate}
        >
          {link.label}
        </Link>
      ))}
      {pathname !== "/docs" && (
        <Link
          href="/docs"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          onClick={onNavigate}
        >
          Docs
        </Link>
      )}
    </nav>
  );
}

export function Navbar() {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;

  const closeSheet = () => setOpen(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const authenticatedDesktop = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden items-center gap-2 sm:inline-flex">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || undefined} alt={user?.name || "User avatar"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:inline">
            {user?.name || user?.email || "Account"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-1 p-3 text-sm">
          <span className="font-medium">{user?.name || "Workspace"}</span>
          {user?.email ? (
            <span className="truncate text-muted-foreground">{user.email}</span>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const unauthenticatedDesktop = (
    <div className="hidden items-center gap-2 sm:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </div>
  );

  const desktopCta = isPending ? (
    <div className="hidden items-center gap-2 sm:flex">
      <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
      <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
    </div>
  ) : user ? (
    authenticatedDesktop
  ) : (
    unauthenticatedDesktop
  );

  const mobileCtaButtons = isPending ? (
    <div className="flex flex-col gap-2">
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
    </div>
  ) : user ? (
    <div className="flex w-full flex-col gap-3">
      <Button asChild onClick={closeSheet}>
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await handleSignOut();
          closeSheet();
        }}
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  ) : (
    <div className="flex w-full flex-col gap-2">
      <Button asChild variant="outline" onClick={closeSheet}>
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button asChild onClick={closeSheet}>
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </div>
  );

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              EA
            </span>
            everything-app
          </Link>
          <div className="hidden sm:block">
            <NavLinks />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {desktopCta}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-4">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold">Menu</SheetTitle>
              </SheetHeader>
              <NavLinks onNavigate={closeSheet} />
              <Separator />
              {mobileCtaButtons}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
