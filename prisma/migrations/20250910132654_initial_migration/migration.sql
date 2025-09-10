-- CreateEnum
CREATE TYPE "public"."EvaluationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "api_base_url" TEXT,
    "npm_package" TEXT,
    "env_vars" TEXT[],
    "doc_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "version" TEXT,
    "provider_id" TEXT NOT NULL,
    "supports_attachments" BOOLEAN NOT NULL DEFAULT false,
    "supports_reasoning" BOOLEAN NOT NULL DEFAULT false,
    "supports_temperature" BOOLEAN NOT NULL DEFAULT true,
    "supports_tool_call" BOOLEAN NOT NULL DEFAULT false,
    "supports_streaming" BOOLEAN NOT NULL DEFAULT false,
    "context_limit" INTEGER,
    "output_limit" INTEGER,
    "knowledge_cutoff" TEXT,
    "release_date" TIMESTAMP(3),
    "last_updated" TIMESTAMP(3),
    "input_modalities" TEXT[],
    "output_modalities" TEXT[],
    "open_weights" BOOLEAN NOT NULL DEFAULT false,
    "input_cost_per_1m" DOUBLE PRECISION,
    "output_cost_per_1m" DOUBLE PRECISION,
    "reasoning_cost_per_1m" DOUBLE PRECISION,
    "cache_read_per_1m" DOUBLE PRECISION,
    "cache_write_per_1m" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evaluations" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "session_id" TEXT,
    "test_type" TEXT NOT NULL DEFAULT 'quantization_detection',
    "status" "public"."EvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "total_tests" INTEGER NOT NULL DEFAULT 0,
    "successful_tests" INTEGER NOT NULL DEFAULT 0,
    "failed_tests" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fingerprints" (
    "id" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "final_sentence" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "evaluation_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prompt_responses" (
    "id" TEXT NOT NULL,
    "fingerprint_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "raw_response" TEXT NOT NULL,
    "extracted_answer" TEXT NOT NULL,
    "response_time" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "public"."providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "models_provider_id_name_key" ON "public"."models"("provider_id", "name");

-- CreateIndex
CREATE INDEX "fingerprints_checksum_timestamp_idx" ON "public"."fingerprints"("checksum", "timestamp");

-- CreateIndex
CREATE INDEX "fingerprints_model_id_timestamp_idx" ON "public"."fingerprints"("model_id", "timestamp");

-- CreateIndex
CREATE INDEX "fingerprints_evaluation_id_timestamp_idx" ON "public"."fingerprints"("evaluation_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_responses_fingerprint_id_step_number_key" ON "public"."prompt_responses"("fingerprint_id", "step_number");

-- AddForeignKey
ALTER TABLE "public"."models" ADD CONSTRAINT "models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluations" ADD CONSTRAINT "evaluations_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fingerprints" ADD CONSTRAINT "fingerprints_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fingerprints" ADD CONSTRAINT "fingerprints_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prompt_responses" ADD CONSTRAINT "prompt_responses_fingerprint_id_fkey" FOREIGN KEY ("fingerprint_id") REFERENCES "public"."fingerprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
