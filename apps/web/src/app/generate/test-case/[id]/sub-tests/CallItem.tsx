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
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <div className="mt-3 pt-3 border-t">
            <p className="text-muted-foreground text-xs mb-1">Summary</p>
            <p className="text-sm">{call.summary}</p>
          </div>
        )}

        {call.transcript && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-muted-foreground text-xs mb-1">Transcript</p>
            <p className="text-sm line-clamp-3">{call.transcript}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
