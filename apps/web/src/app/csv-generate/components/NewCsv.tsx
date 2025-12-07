"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {}

const NewCsv: React.FC<Props> = () => {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/csv-generate/new" className="gap-2">
        <Plus className="h-4 w-4" />
        <span>New CSV</span>
      </Link>
    </Button>
  );
};

export default NewCsv;
