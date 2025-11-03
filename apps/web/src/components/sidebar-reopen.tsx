"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function SidebarReopenButton({ className }: { className?: string }) {
  const { isMobile, openMobile, state } = useSidebar();

  // Hidden when: desktop expanded OR mobile sheet open
  const hidden = (!isMobile && state === "expanded") || (isMobile && openMobile);

  if (hidden) return null;

  // Desktop: simple chevron button on left edge at bottom
  const desktop = (
    <div className={cn("fixed left-0 bottom-4 z-50 hidden md:block", className)}>
      <SidebarTrigger className="h-10 w-6 rounded-r-md border-l border-t border-b bg-sidebar hover:bg-sidebar-accent flex items-center justify-center shadow-sm">
        <ChevronRight className="h-4 w-4" />
      </SidebarTrigger>
    </div>
  );

  // Mobile: floating button bottom-left
  const mobile = (
    <div className={cn("fixed left-2 bottom-2 z-50 md:hidden", className)}>
      <SidebarTrigger className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground" />
    </div>
  );

  return <>{isMobile ? mobile : desktop}</>;
}


