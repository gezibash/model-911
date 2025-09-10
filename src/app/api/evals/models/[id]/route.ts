import { type NextRequest, NextResponse } from "next/server";
import { EvaluationController } from "@/lib/evaluationController";
import { env } from "@/env";

const controller = new EvaluationController();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verify cron authentication (optional but recommended)
    const authHeader = request.headers.get("authorization");
    if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const modelId = params.id;

    // Run evaluation for specific model
    const result = await controller.runEvaluationByModelId(modelId);

    return NextResponse.json({
      success: true,
      message: `Evaluation completed for model ${modelId}`,
      data: result.data,
    });
  } catch (error) {
    console.error(`Cron evaluation error for model ${params.id}:`, error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          modelId: params.id,
        },
        { status: error.message === "Model not found" ? 404 : 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        modelId: params.id,
      },
      { status: 500 },
    );
  }
}
