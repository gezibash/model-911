"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FingerprintMetric {
  modelId: string;
  provider: string;
  modelName: string;
  stabilityScore: number;
  uniqueFingerprints: number;
  totalEvaluations: number;
  changesPerDay: number;
  lastChange: string | null;
  status: "stable" | "warning" | "critical";
  currentFingerprint: string | null;
}

export function FingerprintStabilityTable() {
  const [metrics, setMetrics] = useState<FingerprintMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch("/api/fingerprints");
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  const getStatusBadge = (status: FingerprintMetric["status"]) => {
    const variants = {
      stable: "default" as const,
      warning: "secondary" as const,
      critical: "destructive" as const,
    };

    const labels = {
      stable: "Stable",
      warning: "Warning",
      critical: "Critical",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const summary = metrics.reduce(
    (acc, metric) => {
      acc[metric.status]++;
      acc.total++;
      return acc;
    },
    { stable: 0, warning: 0, critical: 0, total: 0 },
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Stable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.stable}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Stability Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stability Score</TableHead>
                <TableHead>Changes/Day</TableHead>
                <TableHead>Unique Fingerprints</TableHead>
                <TableHead>Total Evaluations</TableHead>
                <TableHead>Current Fingerprint</TableHead>
                <TableHead>Last Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow key={metric.modelId} className="hover:bg-muted/50">
                  <TableCell>{metric.provider}</TableCell>
                  <TableCell className="font-medium">
                    {metric.modelName}
                  </TableCell>
                  <TableCell>{getStatusBadge(metric.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">
                        {metric.stabilityScore}
                      </span>
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            metric.stabilityScore >= 80
                              ? "bg-green-500"
                              : metric.stabilityScore >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${metric.stabilityScore}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {metric.changesPerDay}
                  </TableCell>
                  <TableCell>{metric.uniqueFingerprints}</TableCell>
                  <TableCell>{metric.totalEvaluations}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {metric.currentFingerprint}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {metric.lastChange
                      ? new Date(metric.lastChange).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                </TableRow>
              ))}
              {metrics.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    No models with fingerprints found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
