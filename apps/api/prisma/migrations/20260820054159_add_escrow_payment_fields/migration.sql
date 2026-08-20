-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "netAmount" DECIMAL(10,2),
ADD COLUMN     "platformFeeAmount" DECIMAL(10,2),
ADD COLUMN     "stripeTransferId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectedAccountId" TEXT;
