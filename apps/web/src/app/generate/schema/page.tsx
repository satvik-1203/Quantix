"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SchemaGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Schema-driven generation</CardTitle>
            <CardDescription>
              Provide your table/JSON schema, constraints, and any correlations.
              This is a placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon: Import schema, set keys, distributions, and generate
              sample data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
