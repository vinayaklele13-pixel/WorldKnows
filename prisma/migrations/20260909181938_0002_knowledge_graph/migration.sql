-- DropForeignKey
ALTER TABLE "AIConversation" DROP CONSTRAINT "AIConversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_userId_fkey";

-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_userId_fkey";

-- AlterTable
ALTER TABLE "_ResearchProjectEntities" ADD CONSTRAINT "_ResearchProjectEntities_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ResearchProjectEntities_AB_unique";

-- AlterTable
ALTER TABLE "_ResearchProjectTopics" ADD CONSTRAINT "_ResearchProjectTopics_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ResearchProjectTopics_AB_unique";

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
