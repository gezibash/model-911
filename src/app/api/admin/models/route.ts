import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Zod schemas for models.dev API response
const ModelsDevModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  attachment: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  temperature: z.boolean().optional(),
  tool_call: z.boolean().optional(),
  streaming: z.boolean().optional(),
  knowledge: z.string().optional(),
  release_date: z.string().optional(),
  last_updated: z.string().optional(),
  modalities: z
    .object({
      input: z.array(z.string()).optional(),
      output: z.array(z.string()).optional(),
    })
    .optional(),
  open_weights: z.boolean().optional(),
  cost: z
    .object({
      input: z.number().optional(),
      output: z.number().optional(),
      reasoning: z.number().optional(),
      cache_read: z.number().optional(),
      cache_write: z.number().optional(),
    })
    .optional(),
  limit: z
    .object({
      context: z.number().optional(),
      output: z.number().optional(),
    })
    .optional(),
});

const ModelsDevProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  env: z.array(z.string()),
  npm: z.string(),
  api: z.string().optional(),
  doc: z.string(),
  models: z.record(z.string(), ModelsDevModelSchema),
});

const ModelsDevDataSchema = z.record(z.string(), ModelsDevProviderSchema);

// Zod schemas for transformed data
const TransformedProviderSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  apiBaseUrl: z.string().nullable(),
  npmPackage: z.string(),
  envVars: z.array(z.string()),
  docUrl: z.string(),
});

const TransformedModelSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  version: z.string().nullable(),
  supportsAttachments: z.boolean(),
  supportsReasoning: z.boolean(),
  supportsTemperature: z.boolean(),
  supportsToolCall: z.boolean(),
  supportsStreaming: z.boolean(),
  contextLimit: z.number().nullable(),
  outputLimit: z.number().nullable(),
  knowledgeCutoff: z.string().nullable(),
  releaseDate: z.date().nullable(),
  lastUpdated: z.date().nullable(),
  inputModalities: z.array(z.string()),
  outputModalities: z.array(z.string()),
  openWeights: z.boolean(),
  inputCostPer1M: z.number().nullable(),
  outputCostPer1M: z.number().nullable(),
  reasoningCostPer1M: z.number().nullable(),
  cacheReadPer1M: z.number().nullable(),
  cacheWritePer1M: z.number().nullable(),
  isActive: z.boolean(),
});

// Response schemas
const SeedResponseSchema = z.object({
  success: z.boolean(),
  providersCreated: z.number().optional(),
  providersUpdated: z.number().optional(),
  modelsCreated: z.number().optional(),
  modelsUpdated: z.number().optional(),
  totalProviders: z.number().optional(),
  totalModels: z.number().optional(),
  error: z.string().optional(),
});

const StatusResponseSchema = z.object({
  success: z.boolean(),
  currentData: z
    .object({
      providers: z.number(),
      models: z.number(),
    })
    .optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Type inference from Zod schemas
type ModelsDevModel = z.infer<typeof ModelsDevModelSchema>;
type ModelsDevProvider = z.infer<typeof ModelsDevProviderSchema>;
type ModelsDevData = z.infer<typeof ModelsDevDataSchema>;

async function fetchModelsData(): Promise<ModelsDevData> {
  const response = await fetch("https://models.dev/api.json");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch models data: ${response.status} ${response.statusText}`,
    );
  }

  const rawData = await response.json();

  try {
    return ModelsDevDataSchema.parse(rawData);
  } catch (error) {
    console.error("Failed to validate models.dev API response:", error);
    throw new Error("Invalid data structure from models.dev API");
  }
}

function transformProviderData(
  providerId: string,
  providerData: ModelsDevProvider,
) {
  const transformed = {
    name: providerId,
    displayName: providerData.name,
    apiBaseUrl: providerData.api || null,
    npmPackage: providerData.npm,
    envVars: providerData.env,
    docUrl: providerData.doc,
  };

  return TransformedProviderSchema.parse(transformed);
}

function transformModelData(modelId: string, modelData: ModelsDevModel) {
  // Parse and validate dates
  const parseDate = (dateString?: string): Date | null => {
    if (!dateString) return null;
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const releaseDate = parseDate(modelData.release_date);
  const lastUpdated = parseDate(modelData.last_updated);

  const transformed = {
    name: modelId,
    displayName: modelData.name,
    version: null, // models.dev doesn't have explicit version field
    supportsAttachments: modelData.attachment || false,
    supportsReasoning: modelData.reasoning || false,
    supportsTemperature: modelData.temperature !== false, // default true
    supportsToolCall: modelData.tool_call || false,
    supportsStreaming: modelData.streaming || false,
    contextLimit: modelData.limit?.context || null,
    outputLimit: modelData.limit?.output || null,
    knowledgeCutoff: modelData.knowledge || null,
    releaseDate,
    lastUpdated,
    inputModalities: modelData.modalities?.input || [],
    outputModalities: modelData.modalities?.output || [],
    openWeights: modelData.open_weights || false,
    inputCostPer1M: modelData.cost?.input || null,
    outputCostPer1M: modelData.cost?.output || null,
    reasoningCostPer1M: modelData.cost?.reasoning || null,
    cacheReadPer1M: modelData.cost?.cache_read || null,
    cacheWritePer1M: modelData.cost?.cache_write || null,
    isActive: true,
  };

  return TransformedModelSchema.parse(transformed);
}

export async function POST() {
  try {
    console.log("Fetching models data from models.dev...");
    const modelsData = await fetchModelsData();

    console.log(`Processing ${Object.keys(modelsData).length} providers...`);

    const result = await prisma.$transaction(
      async (tx) => {
        // Transform all provider data first
        const providerEntries = Object.entries(modelsData);
        const transformedProviders = providerEntries.map(
          ([providerId, providerData]) => ({
            id: providerId,
            data: transformProviderData(providerId, providerData),
          }),
        );

        console.log("Processing providers in batch...");

        // Get existing providers to determine which are new vs updates
        const existingProviders = await tx.provider.findMany({
          where: {
            name: { in: transformedProviders.map((p) => p.id) },
          },
          select: { name: true },
        });

        const existingProviderNames = new Set(
          existingProviders.map((p) => p.name),
        );

        // Separate new providers from updates
        const newProviders = transformedProviders.filter(
          (p) => !existingProviderNames.has(p.id),
        );
        const updateProviders = transformedProviders.filter((p) =>
          existingProviderNames.has(p.id),
        );

        let providersCreated = 0;
        let providersUpdated = 0;

        // Batch create new providers
        if (newProviders.length > 0) {
          await tx.provider.createMany({
            data: newProviders.map((p) => p.data),
          });
          providersCreated = newProviders.length;
        }

        // Batch update existing providers
        for (const provider of updateProviders) {
          await tx.provider.update({
            where: { name: provider.id },
            data: provider.data,
          });
          providersUpdated++;
        }

        console.log("Processing models in batch...");

        // Get all provider IDs for relationship mapping
        const allProviders = await tx.provider.findMany({
          select: { id: true, name: true },
        });
        const providerNameToId = new Map(
          allProviders.map((p) => [p.name, p.id]),
        );

        // Transform all model data with provider relationships
        const allModelData: Array<{
          providerName: string;
          modelId: string;
          data: ReturnType<typeof transformModelData> & { providerId: string };
        }> = [];

        for (const [providerId, providerData] of providerEntries) {
          const dbProviderId = providerNameToId.get(providerId);
          if (!dbProviderId) {
            console.error(`Provider ID not found for ${providerId}`);
            continue;
          }

          const modelEntries = Object.entries(providerData.models || {});
          for (const [modelId, modelData] of modelEntries) {
            try {
              const transformedModel = transformModelData(modelId, modelData);
              allModelData.push({
                providerName: providerId,
                modelId,
                data: {
                  ...transformedModel,
                  providerId: dbProviderId,
                },
              });
            } catch (error) {
              console.error(`Error transforming model ${modelId}:`, error);
            }
          }
        }

        // Get existing models to determine new vs updates
        const existingModels = await tx.model.findMany({
          where: {
            OR: allModelData.map((m) => ({
              name: m.modelId,
              provider: { name: m.providerName },
            })),
          },
          select: {
            id: true,
            name: true,
            provider: { select: { name: true } },
          },
        });

        const existingModelKeys = new Set(
          existingModels.map((m) => `${m.provider.name}:${m.name}`),
        );

        const newModels = allModelData.filter(
          (m) => !existingModelKeys.has(`${m.providerName}:${m.modelId}`),
        );
        const updateModels = allModelData.filter((m) =>
          existingModelKeys.has(`${m.providerName}:${m.modelId}`),
        );

        let modelsCreated = 0;
        let modelsUpdated = 0;

        // Batch create new models
        if (newModels.length > 0) {
          await tx.model.createMany({
            data: newModels.map((m) => m.data),
          });
          modelsCreated = newModels.length;
        }

        // Update existing models
        for (const model of updateModels) {
          const existingModel = existingModels.find(
            (em) =>
              em.name === model.modelId &&
              em.provider.name === model.providerName,
          );

          if (existingModel) {
            await tx.model.update({
              where: { id: existingModel.id },
              data: model.data,
            });
            modelsUpdated++;
          }
        }

        return {
          providersCreated,
          providersUpdated,
          modelsCreated,
          modelsUpdated,
        };
      },
      {
        timeout: 60000, // 60 seconds timeout for large batch operations
      },
    );

    const summary = {
      success: true,
      ...result,
      totalProviders: result.providersCreated + result.providersUpdated,
      totalModels: result.modelsCreated + result.modelsUpdated,
    };

    // Validate response before sending
    const validatedSummary = SeedResponseSchema.parse(summary);
    console.log("Seeding completed:", validatedSummary);
    return NextResponse.json(validatedSummary);
  } catch (error) {
    console.error("Error seeding models:", error);

    const errorResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during seeding",
    };

    const validatedError = SeedResponseSchema.parse(errorResponse);
    return NextResponse.json(validatedError, { status: 500 });
  }
}

export async function GET() {
  try {
    const providers = await prisma.provider.count();
    const models = await prisma.model.count();

    const response = {
      success: true,
      currentData: {
        providers,
        models,
      },
      message:
        "Use POST method to seed the database with latest data from models.dev",
    };

    const validatedResponse = StatusResponseSchema.parse(response);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Error fetching current data:", error);

    const errorResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while fetching status",
    };

    const validatedError = StatusResponseSchema.parse(errorResponse);
    return NextResponse.json(validatedError, { status: 500 });
  }
}
