-- CreateTable
CREATE TABLE "product_sections" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'static',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "assetUrl" TEXT,
    "assetType" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "ctaStyle" TEXT DEFAULT 'primary',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_sections_productId_idx" ON "product_sections"("productId");

-- CreateIndex
CREATE INDEX "product_sections_productId_sortOrder_idx" ON "product_sections"("productId", "sortOrder");

-- AddForeignKey
ALTER TABLE "product_sections" ADD CONSTRAINT "product_sections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
