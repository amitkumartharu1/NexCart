import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] as const;

function isAllowed(role: string) {
  return ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number]);
}

// ─── GET: List bills (paginated) ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAllowed(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";

  const where: any = {};
  if (search) {
    where.OR = [
      { billNumber:    { contains: search, mode: "insensitive" } },
      { customerName:  { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        staff: { select: { name: true, email: true } },
        items: { select: { name: true, quantity: true, unitPrice: true, total: true } },
      },
    }),
    prisma.bill.count({ where }),
  ]);

  return NextResponse.json({
    bills,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── POST: Create a new bill ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAllowed(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { customerName, customerPhone, items, taxRate, discountAmount, paymentMethod, notes, isPaid } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  // Validate items
  for (const item of items) {
    if (!item.name || !item.quantity || item.unitPrice == null) {
      return NextResponse.json({ error: "Each item must have name, quantity, and unitPrice" }, { status: 400 });
    }
  }

  // Calculate totals
  const taxPct   = Number(taxRate ?? 13);
  const discount = Number(discountAmount ?? 0);
  const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
  const taxAmount = Math.round(((subtotal - discount) * (taxPct / 100)) * 100) / 100;
  const total     = Math.round((subtotal - discount + taxAmount) * 100) / 100;

  // Generate bill number: BILL-YYYYMMDD-XXXXX
  const dateStr  = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random   = Math.random().toString(36).substring(2, 7).toUpperCase();
  const billNumber = `BILL-${dateStr}-${random}`;

  const bill = await prisma.bill.create({
    data: {
      billNumber,
      staffId:       session.user.id,
      customerName:  customerName ?? null,
      customerPhone: customerPhone ?? null,
      subtotal,
      taxRate:       taxPct,
      taxAmount,
      discountAmount: discount,
      total,
      paymentMethod: paymentMethod ?? "CASH",
      notes:         notes ?? null,
      isPaid:        isPaid !== false,
      items: {
        create: items.map((item: any) => ({
          productId: item.productId ?? null,
          name:      item.name,
          sku:       item.sku ?? null,
          quantity:  Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total:     Math.round(Number(item.unitPrice) * Number(item.quantity) * 100) / 100,
        })),
      },
    },
    include: {
      staff: { select: { name: true, email: true } },
      items: true,
    },
  });

  return NextResponse.json({ bill }, { status: 201 });
}
