-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "googleCalendarEventId" TEXT;

-- AlterTable
ALTER TABLE "CounsellorProfile" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiry" TIMESTAMP(3);
