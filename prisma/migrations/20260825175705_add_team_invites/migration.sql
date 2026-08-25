-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE');

-- AlterTable
ALTER TABLE "business_members" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "business_members_inviteToken_key" ON "business_members"("inviteToken");

-- CreateIndex
CREATE INDEX "business_members_businessId_idx" ON "business_members"("businessId");

