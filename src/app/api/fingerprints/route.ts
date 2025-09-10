import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get models with fingerprints and calculate stability metrics
    const modelsWithFingerprints = await prisma.model.findMany({
      include: {
        provider: true,
        fingerprints: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          orderBy: { timestamp: "desc" },
        },
      },
      where: {
        fingerprints: {
          some: {}, // Only models that have at least one fingerprint
        },
      },
    });

    const metrics = modelsWithFingerprints.map((model) => {
      const fingerprints = model.fingerprints;
      const uniqueChecksums = new Set(fingerprints.map((f) => f.checksum));
      const totalEvaluations = fingerprints.length;
      const daysSpan = 30;
      const changesPerDay = uniqueChecksums.size / daysSpan;

      // Calculate stability score (inverse of change rate, scaled 0-100)
      const maxChangesPerDay = 1; // Normalize against 1 change per day being 0 score
      const stabilityScore = Math.max(
        0,
        100 - (changesPerDay / maxChangesPerDay) * 100,
      );

      // Determine status
      let status: "stable" | "warning" | "critical";
      if (changesPerDay <= 0.1) status = "stable";
      else if (changesPerDay <= 0.5) status = "warning";
      else status = "critical";

      return {
        modelId: model.id,
        provider: model.provider.displayName,
        modelName: model.displayName,
        stabilityScore: Math.round(stabilityScore),
        uniqueFingerprints: uniqueChecksums.size,
        totalEvaluations,
        changesPerDay: Math.round(changesPerDay * 100) / 100,
        lastChange: fingerprints[0]?.timestamp || null,
        status,
        currentFingerprint: fingerprints[0]?.checksum.substring(0, 8) || null,
      };
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching fingerprint metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch fingerprint metrics" },
      { status: 500 },
    );
  }
}
