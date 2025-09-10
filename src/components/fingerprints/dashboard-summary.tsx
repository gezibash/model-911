"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSummary } from "@/types/fingerprint";
import { TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";

interface DashboardSummaryProps {
  summary: DashboardSummary;
}

export function DashboardSummaryCards({ summary }: DashboardSummaryProps) {
  const cards = [
    {
      title: "Total Models",
      value: summary.totalModels.toString(),
      description: "Models being monitored",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      title: "Stable Models",
      value: summary.stableModels.toString(),
      description: `${Math.round((summary.stableModels / summary.totalModels) * 100)}% of total`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Warning Models",
      value: summary.warningModels.toString(),
      description: `${Math.round((summary.warningModels / summary.totalModels) * 100)}% of total`,
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
    {
      title: "Critical Models",
      value: summary.criticalModels.toString(),
      description: `${Math.round((summary.criticalModels / summary.totalModels) * 100)}% of total`,
      icon: TrendingUp,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Average Stability Score
          </CardTitle>
          <CardDescription>
            Overall system stability across all models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold">
              {summary.averageStabilityScore}/100
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    summary.averageStabilityScore >= 80
                      ? "bg-green-500"
                      : summary.averageStabilityScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${summary.averageStabilityScore}%` }}
                />
              </div>
            </div>
            <Badge
              variant={
                summary.averageStabilityScore >= 80
                  ? "success"
                  : summary.averageStabilityScore >= 60
                    ? "warning"
                    : "critical"
              }
            >
              {summary.averageStabilityScore >= 80
                ? "HEALTHY"
                : summary.averageStabilityScore >= 60
                  ? "MODERATE"
                  : "CRITICAL"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
