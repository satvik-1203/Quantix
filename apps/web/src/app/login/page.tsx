"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Sigma, FlaskConical, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100svh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="bg-background/80 border-input/60 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <CardDescription>
                Quantix · Synthetic Data, Grounded in Truth
              </CardDescription>
            </div>
            <CardTitle className="text-2xl mt-2">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access the research console
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@university.edu"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm text-muted-foreground"
              >
                Password
              </label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>

            <Button className="w-full">Continue</Button>

            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <Link
                href="/forgot"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
              <Link
                href="/signup"
                className="hover:text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                Create account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Sigma className="w-3.5 h-3.5" />
                Designed for researchers: math-first, privacy-preserving,
                verifiable
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5" />
                No real data exposure — 100% synthetic generation
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Data grounded in statistical truth and auditability
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
