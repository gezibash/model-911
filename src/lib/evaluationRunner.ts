import { generateText } from "ai";
import { SequentialPromptBuilder, QUANTIZATION_CHAIN } from "./promptBuilder";
import {
  extractAnswerFromResponse,
  calculateFingerprint,
  PromptResponseData,
} from "./fingerprintUtils";
import { buildFinalSentence } from "./promptBuilder";
import { resolveAIModel } from "./modelResolver";
import { prisma } from "./prisma";
import { EvaluationStatus } from "../generated/prisma";

export interface EvaluationSession {
  evaluationId: string;
  fingerprintId: string;
  fingerprint: string;
  finalSentence: string;
  duration: number;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  status: EvaluationStatus;
}

export async function runSequentialEvaluation(
  modelId: string,
  sessionId?: string,
): Promise<EvaluationSession> {
  const startTime = Date.now();

  // Create evaluation record
  const evaluation = await prisma.evaluation.create({
    data: {
      modelId,
      sessionId,
      status: EvaluationStatus.RUNNING,
      totalTests: QUANTIZATION_CHAIN.templates.length,
      successfulTests: 0,
      failedTests: 0,
    },
  });

  try {
    // Resolve the AI model
    const aiModel = await resolveAIModel(modelId);

    const promptBuilder = new SequentialPromptBuilder(QUANTIZATION_CHAIN);
    const answers: Record<string, string> = {};
    const promptResponses: PromptResponseData[] = [];

    let successfulTests = 0;
    let failedTests = 0;

    // SEQUENTIAL EXECUTION - each step depends on previous answers
    for (let step = 1; step <= promptBuilder.getTotalSteps(); step++) {
      const prompt = promptBuilder.buildPrompt(step, answers);
      const stepStartTime = Date.now();

      try {
        const { text } = await generateText({
          model: aiModel,
          prompt,
          system: promptBuilder.getSystemPrompt(),
          maxOutputTokens: 50,
          temperature: 0,
        });

        const responseTime = Date.now() - stepStartTime;
        const extractedAnswer = extractAnswerFromResponse(text);

        // Store this step's answer for next iteration
        const answerValue = extractedAnswer || "ERROR";
        answers[`ANSWER_${step}`] = answerValue;

        // Track success/failure
        if (extractedAnswer) {
          successfulTests++;
        } else {
          failedTests++;
        }

        // Store prompt response data
        promptResponses.push({
          stepNumber: step,
          prompt,
          rawResponse: text,
          extractedAnswer: answerValue,
          responseTime,
        });
      } catch (error) {
        const responseTime = Date.now() - stepStartTime;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        answers[`ANSWER_${step}`] = "ERROR";
        failedTests++;

        promptResponses.push({
          stepNumber: step,
          prompt,
          rawResponse: errorMessage,
          extractedAnswer: "ERROR",
          responseTime,
        });
      }
    }

    // Build final sentence and generate fingerprint
    const finalSentence = buildFinalSentence(answers);
    const fingerprint = calculateFingerprint(finalSentence);

    // Create fingerprint record
    const fingerprintRecord = await prisma.fingerprint.create({
      data: {
        checksum: fingerprint,
        finalSentence,
        modelId,
        evaluationId: evaluation.id,
      },
    });

    // Store all prompt responses
    await prisma.promptResponse.createMany({
      data: promptResponses.map((pr) => ({
        fingerprintId: fingerprintRecord.id,
        stepNumber: pr.stepNumber,
        prompt: pr.prompt,
        rawResponse: pr.rawResponse,
        extractedAnswer: pr.extractedAnswer,
        responseTime: pr.responseTime,
      })),
    });

    // Calculate duration and update evaluation
    const duration = Math.round((Date.now() - startTime) / 1000);

    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        status: EvaluationStatus.COMPLETED,
        completedAt: new Date(),
        duration,
        successfulTests,
        failedTests,
      },
    });

    return {
      evaluationId: evaluation.id,
      fingerprintId: fingerprintRecord.id,
      fingerprint,
      finalSentence,
      duration,
      totalTests: promptBuilder.getTotalSteps(),
      successfulTests,
      failedTests,
      status: EvaluationStatus.COMPLETED,
    };
  } catch (error) {
    // Mark evaluation as failed
    const duration = Math.round((Date.now() - startTime) / 1000);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        status: EvaluationStatus.FAILED,
        completedAt: new Date(),
        duration,
        errorMessage,
      },
    });

    throw error;
  }
}
