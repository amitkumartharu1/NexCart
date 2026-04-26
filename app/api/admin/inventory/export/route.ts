/**
 * GET /api/admin/inventory/export
 * Exports full product inventory as an Excel (.xlsx) file.
 * Requires ADMIN, SUPER_ADMIN, or MANAGER role.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import ExcelJS from "exceljs";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all products with inventory
  const products = await prisma.product.findMany({
    select: {
      id:           true,
      name:         true,
      sku:          true,
      status:       true,
      basePrice:    true,
      comparePrice: true,
      category: { select: { name: true } },
      brand:    { select: { name: true } },
      inventory: {
        select: {
          quantity:          true,
          reservedQuantity:  true,
          lowStockThreshold: true,
          lastRestockedAt:   true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Build workbook
  const workbook  = new ExcelJS.Workbook();
  workbook.creator = "NexCart Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Inventory", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Header style
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF6366F1" },
  };
  const headerFont: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };

  // Columns
  sheet.columns = [
    { header: "Product Name",      key: "name",           width: 35 },
    { header: "SKU",               key: "sku",            width: 18 },
    { header: "Category",          key: "category",       width: 18 },
    { header: "Brand",             key: "brand",          width: 16 },
    { header: "Status",            key: "status",         width: 14 },
    { header: "Price (NPR)",       key: "price",          width: 14 },
    { header: "Compare Price",     key: "comparePrice",   width: 16 },
    { header: "In Stock",          key: "quantity",       width: 12 },
    { header: "Reserved",          key: "reserved",       width: 12 },
    { header: "Available",         key: "available",      width: 12 },
    { header: "Low Stock Thresh.", key: "threshold",      width: 18 },
    { header: "Stock Level",       key: "level",          width: 14 },
    { header: "Last Restocked",    key: "lastRestocked",  width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill   = headerFill;
    cell.font   = headerFont;
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF4F46E5" } },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 22;

  // Data rows
  products.forEach((p, idx) => {
    const qty       = p.inventory?.quantity ?? 0;
    const reserved  = p.inventory?.reservedQuantity ?? 0;
    const available = Math.max(0, qty - reserved);
    const threshold = p.inventory?.lowStockThreshold ?? 5;
    const level     = qty === 0 ? "Out of Stock" : qty <= threshold ? "Low Stock" : "In Stock";

    const row = sheet.addRow({
      name:          p.name,
      sku:           p.sku ?? "",
      category:      p.category?.name ?? "",
      brand:         p.brand?.name ?? "",
      status:        p.status,
      price:         Number(p.basePrice),
      comparePrice:  p.comparePrice ? Number(p.comparePrice) : "",
      quantity:      qty,
      reserved,
      available,
      threshold,
      level,
      lastRestocked: p.inventory?.lastRestockedAt
        ? new Date(p.inventory.lastRestockedAt).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
          })
        : "Never",
    });

    // Zebra stripes
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5FF" } };
      });
    }

    // Color-code Stock Level cell
    const levelCell = row.getCell("level");
    if (level === "Out of Stock") {
      levelCell.font = { color: { argb: "FFEF4444" }, bold: true };
    } else if (level === "Low Stock") {
      levelCell.font = { color: { argb: "FFF97316" }, bold: true };
    } else {
      levelCell.font = { color: { argb: "FF22C55E" }, bold: true };
    }

    // Number format for price
    row.getCell("price").numFmt        = "#,##0.00";
    row.getCell("comparePrice").numFmt = "#,##0.00";
  });

  // Auto-filter on header row
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: 1, column: sheet.columns.length },
  };

  // Freeze header row
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  // Summary sheet
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric",  key: "metric", width: 30 },
    { header: "Value",   key: "value",  width: 20 },
  ];
  const sumHeader = summary.getRow(1);
  sumHeader.eachCell((cell) => { cell.fill = headerFill; cell.font = headerFont; });

  const outOfStock = products.filter((p) => (p.inventory?.quantity ?? 0) === 0).length;
  const lowStock   = products.filter((p) => {
    const q = p.inventory?.quantity ?? 0;
    const t = p.inventory?.lowStockThreshold ?? 5;
    return q > 0 && q <= t;
  }).length;

  summary.addRows([
    { metric: "Total Products",         value: products.length },
    { metric: "Out of Stock",           value: outOfStock },
    { metric: "Low Stock",              value: lowStock },
    { metric: "In Stock",               value: products.length - outOfStock - lowStock },
    { metric: "Export Date",            value: new Date().toLocaleString() },
  ]);

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer() as ArrayBuffer;

  const filename = `nexcart-inventory-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
