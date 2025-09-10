import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { prisma } from "./prisma";

export async function resolveAIModel(modelId: string): Promise<LanguageModel> {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: { provider: true },
  });

  if (!model) {
    throw new Error(`Model not found: ${modelId}`);
  }

  switch (model.provider.name.toLowerCase()) {
    case "openai":
      return openai(model.name);

    case "anthropic":
      return anthropic(model.name);

    default:
      throw new Error(`Unsupported provider: ${model.provider.name}`);
  }
}
