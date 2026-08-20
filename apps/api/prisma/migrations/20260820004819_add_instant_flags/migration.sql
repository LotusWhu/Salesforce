-- AlterTable
ALTER TABLE "ServiceListing" ADD COLUMN     "supportsInstantBooking" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false;
