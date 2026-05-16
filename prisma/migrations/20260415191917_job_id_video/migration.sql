/*
  Warnings:

  - You are about to drop the column `videoId` on the `Job` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jobId]` on the table `Video` will be added. If there are existing duplicate values, this will fail.
  - Made the column `niche` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `actionMode` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scriptMode` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `settings` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `jobId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_videoId_fkey";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "videoId",
ALTER COLUMN "niche" SET NOT NULL,
ALTER COLUMN "actionMode" SET NOT NULL,
ALTER COLUMN "scriptMode" SET NOT NULL,
ALTER COLUMN "settings" SET NOT NULL;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "jobId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Video_jobId_key" ON "Video"("jobId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("jobId") ON DELETE RESTRICT ON UPDATE CASCADE;
