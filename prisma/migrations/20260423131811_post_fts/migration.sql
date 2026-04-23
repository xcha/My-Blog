-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "search_vector" tsvector;

-- CreateIndex
CREATE INDEX "Post_search_vector_idx" ON "Post" USING GIN ("search_vector");
