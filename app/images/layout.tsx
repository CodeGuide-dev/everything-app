import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import "@/app/dashboard/theme.css";

export const metadata = {
  title: "Image Studio",
  description: "Iterate on AI generated images with session history.",
};

export default function ImagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      className="h-dvh"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-full overflow-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
