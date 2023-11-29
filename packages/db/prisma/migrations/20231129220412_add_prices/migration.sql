/*
  Warnings:

  - Added the required column `price` to the `Dishes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dishes" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
