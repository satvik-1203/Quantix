"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  ClipboardList,
  FileSpreadsheet,
  Star,
  ChevronLeft,
  FileText,
  Trash2,
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Tests",
    url: "/",
    icon: ClipboardList,
  },
  {
    title: "CSV Data Generation",
    url: "/generate/start",
    icon: FileSpreadsheet,
  },
  {
    title: "Email DataLake",
    url: "/dataset/threads",
    icon: FileText,
  },
  {
    title: "Trash",
    url: "/trash",
    icon: Trash2,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm truncate">
              Capstone Class
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Test Suite
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:py-2">
          <SidebarGroupContent className="group-data-[collapsible=icon]:px-0">
            <SidebarMenu className="group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:items-center">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem
                    key={item.title}
                    className="group-data-[collapsible=icon]:w-auto"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      size="lg"
                      className="h-10 text-[15px] group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <Link
                        href={item.url as any}
                        className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 space-y-2 group-data-[collapsible=icon]:space-y-2 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <span className="text-sm font-semibold">S</span>
            </div>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-medium truncate">User</div>
              <div className="text-xs text-muted-foreground truncate">
                Active
              </div>
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <ModeToggle />
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
              onClick={toggleSidebar}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform shrink-0",
                  state === "collapsed" && "rotate-180"
                )}
              />
              <span className="group-data-[collapsible=icon]:hidden">
                Collapse
              </span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
