"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Call {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  transcript?: string;
  summary?: string;
  cost?: number;
  customer?: {
    number: string;
  };
}

interface CallItemProps {
  call: Call;
}

export default function CallItem({ call }: CallItemProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/15 text-green-400 border border-green-500/30";
      case "failed":
        return "bg-red-500/15 text-red-400 border border-red-500/30";
      case "in-progress":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
      default:
        return "bg-foreground/10 text-foreground/80 border border-foreground/20";
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return "N/A";
    return `$${cost.toFixed(4)}`;
  };

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">
            Call {call.id.slice(0, 8)}...
          </CardTitle>
          <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Started</p>
            <p className="font-medium">
              {formatDistanceToNow(new Date(call.startedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Duration</p>
            <p className="font-medium">{formatDuration(call.duration)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cost</p>
            <p className="font-medium">{formatCost(call.cost)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Phone</p>
            <p className="font-medium">{call.customer?.number || "N/A"}</p>
          </div>
        </div>

        {call.summary && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-muted-foreground text-xs mb-1">Summary</p>
            <p className="text-sm leading-relaxed">{call.summary}</p>
          </div>
        )}

        {call.transcript && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-muted-foreground text-xs mb-1">Transcript</p>
            <p className="text-sm line-clamp-3 leading-relaxed">
              {call.transcript}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
