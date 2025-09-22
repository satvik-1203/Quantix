"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Braces, Wand2, Table, HelpCircle, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Generate Synthetic Data
        </h1>
        <p className="text-lg text-muted-foreground mt-3">
          Choose the path that fits your research workflow.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
        <Card className="data-grid">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Braces className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">
                For precise needs
              </span>
            </div>
            <CardTitle>I know the exact schema</CardTitle>
            <CardDescription>
              Define tables, columns, data types, and constraints. Generate
              datasets that match your specification exactly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Table className="w-4 h-4" /> Relational schema support
              </li>
              <li className="flex items-center gap-2">
                <Braces className="w-4 h-4" /> JSON/Avro schema import
              </li>
              <li className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Constraints and distributions
              </li>
            </ul>
            <Button asChild className="w-full">
              <Link
                href="/generate/schema"
                className="inline-flex items-center"
              >
                Start with schema <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="data-grid">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wand2 className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">
                For exploration
              </span>
            </div>
            <CardTitle>I need guidance</CardTitle>
            <CardDescription>
              Answer a few questions and we will suggest sensible schema and
              data shapes for your task.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Guided questionnaire
              </li>
              <li className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> Suggested fields and distributions
              </li>
              <li className="flex items-center gap-2">
                <Table className="w-4 h-4" /> Preview sample rows
              </li>
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link
                href="/generate/guided"
                className="inline-flex items-center"
              >
                Start guided setup <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
