"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Loader2, DollarSign, Coins } from "lucide-react";

interface ExpenseDialogProps {
  subTestId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExpenseData {
  voiceCost: number;
  emailCost: number;
  totalCost: number;
}

export default function ExpenseDialog({
  subTestId,
  open,
  onOpenChange,
}: ExpenseDialogProps) {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && subTestId) {
      fetchExpense();
    }
  }, [open, subTestId]);

  const fetchExpense = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/analytics-expense/${subTestId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch expense data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching expense:", err);
      setError("Failed to load expense report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Expense Report</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : data ? (
            <div className="grid gap-4">
              {/* Voice Agent Cost */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Voice Agent
                    </p>
                    <p className="text-xl font-bold">
                      ${(data.voiceCost / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Agent Cost */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email Agent
                    </p>
                    <p className="text-xl font-bold">
                      ${(data.emailCost / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Cost */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Cost
                    </p>
                    <p className="text-2xl font-bold">
                      ${(data.totalCost / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
