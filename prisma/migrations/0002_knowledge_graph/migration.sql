-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PERSON', 'ORGANIZATION', 'PLACE', 'EVENT', 'CONCEPT', 'TECHNOLOGY', 'OTHER');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicEntity" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicRelationship" (
    "id" TEXT NOT NULL,
    "topicAId" TEXT NOT NULL,
    "topicBId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityRelationship" (
    "id" TEXT NOT NULL,
    "entityAId" TEXT NOT NULL,
    "entityBId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitySource" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntitySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ResearchProjectTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ResearchProjectEntities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_name_type_key" ON "Entity"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TopicEntity_topicId_entityId_key" ON "TopicEntity"("topicId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicRelationship_topicAId_topicBId_type_key" ON "TopicRelationship"("topicAId", "topicBId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRelationship_entityAId_entityBId_type_key" ON "EntityRelationship"("entityAId", "entityBId", "type");

-- CreateIndex
CREATE INDEX "EntityRelationship_sourceId_idx" ON "EntityRelationship"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "EntitySource_entityId_sourceId_key" ON "EntitySource"("entityId", "sourceId");

-- CreateIndex
CREATE INDEX "EntitySource_sourceId_idx" ON "EntitySource"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "_ResearchProjectTopics_AB_unique" ON "_ResearchProjectTopics"("A", "B");

-- CreateIndex
CREATE INDEX "_ResearchProjectTopics_B_index" ON "_ResearchProjectTopics"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ResearchProjectEntities_AB_unique" ON "_ResearchProjectEntities"("A", "B");

-- CreateIndex
CREATE INDEX "_ResearchProjectEntities_B_index" ON "_ResearchProjectEntities"("B");

-- Add Check Constraints
ALTER TABLE "TopicRelationship" ADD CONSTRAINT "chk_no_self_topic" CHECK ("topicAId" <> "topicBId");
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "chk_no_self_entity" CHECK ("entityAId" <> "entityBId");

-- AddForeignKey
ALTER TABLE "TopicEntity" ADD CONSTRAINT "TopicEntity_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicEntity" ADD CONSTRAINT "TopicEntity_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicRelationship" ADD CONSTRAINT "TopicRelationship_topicAId_fkey" FOREIGN KEY ("topicAId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicRelationship" ADD CONSTRAINT "TopicRelationship_topicBId_fkey" FOREIGN KEY ("topicBId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_entityAId_fkey" FOREIGN KEY ("entityAId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_entityBId_fkey" FOREIGN KEY ("entityBId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitySource" ADD CONSTRAINT "EntitySource_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitySource" ADD CONSTRAINT "EntitySource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchProjectTopics" ADD CONSTRAINT "_ResearchProjectTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchProjectTopics" ADD CONSTRAINT "_ResearchProjectTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchProjectEntities" ADD CONSTRAINT "_ResearchProjectEntities_A_fkey" FOREIGN KEY ("A") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchProjectEntities" ADD CONSTRAINT "_ResearchProjectEntities_B_fkey" FOREIGN KEY ("B") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
