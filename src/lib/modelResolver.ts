import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { prisma } from "./prisma";
import { env } from "@/env";

export async function resolveAIModel(modelId: string): Promise<LanguageModel> {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: { provider: true },
  });

  if (!model) {
    throw new Error(`Model not found: ${modelId}`);
  }

  switch (model.provider.name.toLowerCase()) {
    case "openai": {
      return openai(model.name);
    }

    case "anthropic": {
      return anthropic(model.name);
    }

    case "google":
    case "google-vertex":
      return google(model.name);

    case "mistral":
      return mistral(model.name);

    case "xai":
      return xai(model.name);

    case "openrouter": {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });
      return openrouter.chat(model.name);
    }

    default:
      throw new Error(`Unsupported provider: ${model.provider.name}`);
  }
}
