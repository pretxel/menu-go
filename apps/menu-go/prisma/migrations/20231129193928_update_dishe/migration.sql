/*
  Warnings:

  - You are about to drop the column `categories` on the `Dishes` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Dishes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dishes" DROP COLUMN "categories",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Dishes" ADD CONSTRAINT "Dishes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
