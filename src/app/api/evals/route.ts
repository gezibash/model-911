import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EvaluationController } from "@/lib/evaluationController";

const controller = new EvaluationController();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await controller.runEvaluationByModelId(
      body.modelId,
      body.sessionId,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Evaluation error:", error);
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get("modelId") || undefined;
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const result = await controller.getEvaluations(modelId, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Get evaluations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function handleError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid request data", details: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    if (error.message === "Model not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === "Model is not active") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
