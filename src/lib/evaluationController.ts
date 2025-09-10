import { z } from "zod";
import { runSequentialEvaluation } from "@/lib/evaluationRunner";
import { prisma } from "@/lib/prisma";

const EvaluationRequestSchema = z.object({
  modelId: z.string().min(1, "Model ID is required"),
  sessionId: z.string().optional(),
});

export class EvaluationController {
  async runEvaluationByModelId(modelId: string, sessionId?: string) {
    // Validate input
    const { modelId: validatedModelId, sessionId: validatedSessionId } =
      EvaluationRequestSchema.parse({ modelId, sessionId });

    // Verify model exists and is active
    const model = await this.validateModel(validatedModelId);

    // Run evaluation
    const result = await runSequentialEvaluation(
      validatedModelId,
      validatedSessionId,
    );

    return {
      success: true,
      data: {
        evaluationId: result.evaluationId,
        fingerprintId: result.fingerprintId,
        fingerprint: result.fingerprint,
        finalSentence: result.finalSentence,
        duration: result.duration,
        totalTests: result.totalTests,
        successfulTests: result.successfulTests,
        failedTests: result.failedTests,
        status: result.status,
        model: {
          id: model.id,
          name: model.name,
          displayName: model.displayName,
          provider: {
            name: model.provider.name,
            displayName: model.provider.displayName,
          },
        },
      },
    };
  }

  async getEvaluations(modelId?: string, limit = 10, offset = 0) {
    const where = modelId ? { modelId } : {};

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        model: { include: { provider: true } },
        fingerprints: {
          select: { id: true, checksum: true, finalSentence: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.evaluation.count({ where });

    return {
      success: true,
      data: {
        evaluations: evaluations.map(this.formatEvaluation),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    };
  }

  private async validateModel(modelId: string) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      include: { provider: true },
    });

    if (!model) {
      throw new Error("Model not found");
    }

    if (!model.isActive) {
      throw new Error("Model is not active");
    }

    return model;
  }

  private formatEvaluation(evaluation: any) {
    return {
      id: evaluation.id,
      modelId: evaluation.modelId,
      sessionId: evaluation.sessionId,
      status: evaluation.status,
      duration: evaluation.duration,
      totalTests: evaluation.totalTests,
      successfulTests: evaluation.successfulTests,
      failedTests: evaluation.failedTests,
      startedAt: evaluation.startedAt,
      completedAt: evaluation.completedAt,
      model: {
        id: evaluation.model.id,
        name: evaluation.model.name,
        displayName: evaluation.model.displayName,
        provider: {
          name: evaluation.model.provider.name,
          displayName: evaluation.model.provider.displayName,
        },
      },
      fingerprints: evaluation.fingerprints,
    };
  }
}
