"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {}

const NewCsv: React.FC<Props> = () => {
  const [open, setOpen] = useState(false);
  return (
    <Link href="/csv-generate/new">
      <Button variant="outline">
        <Plus className="h-4 w-4" />
        New CSV
      </Button>
    </Link>
  );
};

export default NewCsv;
