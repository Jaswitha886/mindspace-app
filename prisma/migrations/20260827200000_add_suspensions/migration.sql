-- CreateEnum
CREATE TYPE "SuspensionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SUSPENSION_ALERT';

-- CreateTable
CREATE TABLE "Suspension" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "notes" TEXT,
    "status" "SuspensionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id")
);

-- Add the link used to report counsellor notification delivery/read state.
ALTER TABLE "Notification" ADD COLUMN "suspensionId" TEXT;
CREATE INDEX "Notification_suspensionId_idx" ON "Notification"("suspensionId");

-- CreateIndex
CREATE INDEX "Suspension_studentId_idx" ON "Suspension"("studentId");
CREATE INDEX "Suspension_createdById_idx" ON "Suspension"("createdById");
CREATE INDEX "Suspension_status_idx" ON "Suspension"("status");
CREATE INDEX "Suspension_startDate_endDate_idx" ON "Suspension"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "Suspension" ADD CONSTRAINT "Suspension_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Suspension" ADD CONSTRAINT "Suspension_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_suspensionId_fkey" FOREIGN KEY ("suspensionId") REFERENCES "Suspension"("id") ON DELETE CASCADE ON UPDATE CASCADE;
