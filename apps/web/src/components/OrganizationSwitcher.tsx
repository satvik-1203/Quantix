"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { switchOrganization } from "@/app/auth/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Organization = {
  id: number;
  name: string;
  role: string;
};

type OrganizationSwitcherProps = {
  organizations: Organization[];
  currentOrganizationId?: number;
};

export default function OrganizationSwitcher({
  organizations,
  currentOrganizationId,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentOrg = organizations.find((org) => org.id === currentOrganizationId);

  const handleSelect = async (organizationId: number) => {
    if (organizationId === currentOrganizationId) {
      setOpen(false);
      return;
    }

    setIsLoading(true);
    const result = await switchOrganization(organizationId);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Organization switched successfully");
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          <span className="truncate">
            {currentOrg ? currentOrg.name : "Select organization"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => handleSelect(org.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentOrganizationId === org.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{org.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {org.role}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                <span>Create Organization</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
