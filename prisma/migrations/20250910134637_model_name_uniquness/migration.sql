/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `models` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "models_name_key" ON "public"."models"("name");

-- CreateIndex
CREATE INDEX "models_name_idx" ON "public"."models"("name");
