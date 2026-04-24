/**
 * NexCart Database Seed
 *
 * Creates the SUPER_ADMIN account and foundational site data.
 * Run with: npm run db:seed
 *
 * DO NOT commit real passwords. Uses SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD
 * from .env.
 */

import "dotenv/config";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/security/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting NexCart database seed...\n");

  // ===========================================================================
  // Super Admin
  // ===========================================================================

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@nexcart.com";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeThisImmediately#2024";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Super Admin",
        firstName: "Super",
        lastName: "Admin",
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
        passwordHash,
      },
    });
    console.log(`✅ Super Admin created: ${adminEmail}`);
  } else {
    console.log(`⏭  Super Admin already exists: ${adminEmail}`);
  }

  // ===========================================================================
  // Homepage Sections
  // ===========================================================================

  const homepageSections = [
    { key: "hero", title: "Hero", sortOrder: 1, isVisible: true },
    { key: "featured_categories", title: "Featured Categories", sortOrder: 2, isVisible: true },
    { key: "trending_products", title: "Trending Products", sortOrder: 3, isVisible: true },
    { key: "featured_services", title: "Featured Services", sortOrder: 4, isVisible: true },
    { key: "why_nexcart", title: "Why NexCart", sortOrder: 5, isVisible: true },
    { key: "product_showcase", title: "Product Showcase", sortOrder: 6, isVisible: true },
    { key: "testimonials", title: "Customer Reviews", sortOrder: 7, isVisible: true },
    { key: "newsletter", title: "Newsletter / Offers", sortOrder: 8, isVisible: true },
  ];

  for (const section of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { key: section.key },
      update: {},
      create: section,
    });
  }
  console.log(`✅ Homepage sections seeded (${homepageSections.length})`);

  // ===========================================================================
  // Site Settings
  // ===========================================================================

  const settings = [
    { key: "site_name", value: "NexCart", group: "general", label: "Site Name" },
    { key: "site_tagline", value: "Smart Shopping. Modern Services. One Premium Platform.", group: "general", label: "Tagline" },
    { key: "site_email", value: "hello@nexcart.com", group: "general", label: "Contact Email" },
    { key: "site_phone", value: "", group: "general", label: "Contact Phone" },
    { key: "site_address", value: "", group: "general", label: "Business Address" },
    { key: "currency", value: "USD", group: "general", label: "Currency" },
    { key: "currency_symbol", value: "$", group: "general", label: "Currency Symbol" },
    { key: "tax_rate", value: "0", group: "general", label: "Default Tax Rate (%)" },
    { key: "free_shipping_threshold", value: "100", group: "shipping", label: "Free Shipping Min Order ($)" },
    { key: "maintenance_mode", value: "false", type: "boolean", group: "general", label: "Maintenance Mode" },
    { key: "hero_title", value: "NexCart", group: "homepage", label: "Hero Title" },
    { key: "hero_subtitle", value: "Smart Shopping. Modern Services. One Premium Platform.", group: "homepage", label: "Hero Subtitle" },
    { key: "hero_cta_primary", value: "Shop Now", group: "homepage", label: "Hero CTA Primary Text" },
    { key: "hero_cta_primary_url", value: "/shop", group: "homepage", label: "Hero CTA Primary URL" },
    { key: "hero_cta_secondary", value: "Explore Services", group: "homepage", label: "Hero CTA Secondary Text" },
    { key: "hero_cta_secondary_url", value: "/services", group: "homepage", label: "Hero CTA Secondary URL" },
  ];

  for (const setting of settings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        type: setting.type ?? "string",
        group: setting.group,
        label: setting.label,
      },
    });
  }
  console.log(`✅ Site settings seeded (${settings.length})`);

  // ===========================================================================
  // Sample Categories
  // ===========================================================================

  const categories = [
    { name: "Electronics", slug: "electronics", icon: "cpu", sortOrder: 1, isActive: true, isFeatured: true },
    { name: "Gadgets", slug: "gadgets", icon: "zap", sortOrder: 2, isActive: true, isFeatured: true },
    { name: "Fashion", slug: "fashion", icon: "shirt", sortOrder: 3, isActive: true, isFeatured: true },
    { name: "Beauty", slug: "beauty", icon: "sparkles", sortOrder: 4, isActive: true, isFeatured: true },
    { name: "Home & Office", slug: "home-office", icon: "home", sortOrder: 5, isActive: true, isFeatured: true },
    { name: "Gaming", slug: "gaming", icon: "gamepad-2", sortOrder: 6, isActive: true, isFeatured: true },
    { name: "Smart Devices", slug: "smart-devices", icon: "smartphone", sortOrder: 7, isActive: true, isFeatured: false },
    { name: "Accessories", slug: "accessories", icon: "watch", sortOrder: 8, isActive: true, isFeatured: false },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Categories seeded (${categories.length})`);

  // ===========================================================================
  // Sample Service Categories
  // ===========================================================================

  const serviceCategories = [
    { name: "Repair Services", slug: "repair", icon: "wrench", sortOrder: 1, isActive: true, isFeatured: true },
    { name: "Installation", slug: "installation", icon: "settings", sortOrder: 2, isActive: true, isFeatured: true },
    { name: "Consultation", slug: "consultation", icon: "message-circle", sortOrder: 3, isActive: true, isFeatured: true },
    { name: "Digital Services", slug: "digital", icon: "monitor", sortOrder: 4, isActive: true, isFeatured: false },
    { name: "Delivery", slug: "delivery", icon: "truck", sortOrder: 5, isActive: true, isFeatured: false },
  ];

  for (const cat of serviceCategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Service categories seeded (${serviceCategories.length})`);

  // ===========================================================================
  // Sample Brands
  // ===========================================================================

  const brands = [
    { name: "Apple",   slug: "apple",   isActive: true, isFeatured: true,  sortOrder: 1 },
    { name: "Samsung", slug: "samsung", isActive: true, isFeatured: true,  sortOrder: 2 },
    { name: "Sony",    slug: "sony",    isActive: true, isFeatured: true,  sortOrder: 3 },
    { name: "ASUS",    slug: "asus",    isActive: true, isFeatured: false, sortOrder: 4 },
    { name: "Nike",    slug: "nike",    isActive: true, isFeatured: true,  sortOrder: 5 },
    { name: "Logitech",slug: "logitech",isActive: true, isFeatured: false, sortOrder: 6 },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({ where: { slug: brand.slug }, update: {}, create: brand });
  }
  console.log(`✅ Brands seeded (${brands.length})`);

  // ===========================================================================
  // Sample Products (with images + inventory)
  // Images use picsum.photos — deterministic by seed name, always accessible.
  // ===========================================================================

  // Upsert each demo product by slug — safe to re-run; skips slugs that already exist.
  {
    // Fetch category and brand IDs
    const catMap = Object.fromEntries(
      (await prisma.category.findMany({ select: { slug: true, id: true } })).map((c) => [c.slug, c.id])
    );
    const brandMap = Object.fromEntries(
      (await prisma.brand.findMany({ select: { slug: true, id: true } })).map((b) => [b.slug, b.id])
    );

    // img(seed) — returns a consistent 800×800 picsum image
    const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

    const products = [
      // Electronics
      { name: "Pro Wireless Headphones X1",  slug: "pro-wireless-headphones-x1",  sku: "HP-X1-001", shortDescription: "Studio-grade sound with 40-hour battery life.",           categorySlug: "electronics",   brandSlug: "sony",    status: "ACTIVE" as const, isFeatured: true,  basePrice: "149.99", comparePrice: "199.99", image: img("headphones1"),   stock: 85  },
      { name: 'UltraBook Laptop 15"',          slug: "ultrabook-laptop-15",           sku: "LT-UB-002", shortDescription: "Slim, powerful laptop for professionals and creators.",  categorySlug: "electronics",   brandSlug: "asus",    status: "ACTIVE" as const, isFeatured: true,  basePrice: "1099.00",comparePrice: "1299.00",image: img("laptop15"),      stock: 40  },
      { name: '4K Smart LED TV 55"',           slug: "4k-smart-led-tv-55",            sku: "TV-4K-003", shortDescription: "Stunning 4K HDR display with built-in streaming apps.",  categorySlug: "electronics",   brandSlug: "samsung", status: "ACTIVE" as const, isFeatured: false, basePrice: "599.00", comparePrice: "749.00", image: img("smarttv55"),     stock: 22  },
      { name: "Smart Watch Series 9",          slug: "smart-watch-series-9",          sku: "SW-S9-004", shortDescription: "Health tracking, GPS, and always-on display.",           categorySlug: "gadgets",       brandSlug: "apple",   status: "ACTIVE" as const, isFeatured: true,  basePrice: "329.00", comparePrice: "399.00", image: img("smartwatch9"),   stock: 60  },
      { name: "Portable Bluetooth Speaker",    slug: "portable-bluetooth-speaker",    sku: "SP-BT-005", shortDescription: "360° surround sound with 20-hour playtime.",             categorySlug: "gadgets",       brandSlug: "sony",    status: "ACTIVE" as const, isFeatured: false, basePrice: "79.99",  comparePrice: "99.99",  image: img("btspeaker"),     stock: 120 },
      { name: "Wireless Charging Pad Pro",     slug: "wireless-charging-pad-pro",     sku: "CH-WL-006", shortDescription: "Fast Qi wireless charging for all compatible devices.", categorySlug: "gadgets",       brandSlug: "samsung", status: "ACTIVE" as const, isFeatured: false, basePrice: "34.99",  comparePrice: null,     image: img("chargerpad"),    stock: 200 },
      { name: "Gaming Mechanical Keyboard",    slug: "gaming-mechanical-keyboard",    sku: "KB-MK-007", shortDescription: "RGB backlit mechanical keyboard with tactile switches.", categorySlug: "gaming",        brandSlug: "logitech",status: "ACTIVE" as const, isFeatured: true,  basePrice: "119.99", comparePrice: "149.99", image: img("mechkeyboard"),  stock: 75  },
      { name: "Pro Gaming Mouse 8K",           slug: "pro-gaming-mouse-8k",           sku: "MS-G8-008", shortDescription: "8000 DPI precision sensor with 11 programmable buttons.",categorySlug: "gaming",        brandSlug: "logitech",status: "ACTIVE" as const, isFeatured: false, basePrice: "69.99",  comparePrice: "89.99",  image: img("gamingmouse8k"), stock: 95  },
      { name: "Gaming Headset 7.1 Surround",   slug: "gaming-headset-71-surround",    sku: "HS-G7-009", shortDescription: "Virtual 7.1 surround sound for immersive gaming audio.", categorySlug: "gaming",        brandSlug: "sony",    status: "ACTIVE" as const, isFeatured: false, basePrice: "89.99",  comparePrice: "119.99", image: img("gamingheadset"), stock: 50  },
      { name: "Athletic Running Shoes",        slug: "athletic-running-shoes",        sku: "SH-AR-010", shortDescription: "Lightweight, breathable running shoes for all terrain.", categorySlug: "fashion",       brandSlug: "nike",    status: "ACTIVE" as const, isFeatured: true,  basePrice: "129.00", comparePrice: "159.00", image: img("runningshoes"),  stock: 150 },
      { name: "Classic Polo T-Shirt",          slug: "classic-polo-t-shirt",          sku: "TS-CL-011", shortDescription: "Premium cotton polo, slim-fit, available in 8 colors.", categorySlug: "fashion",       brandSlug: "nike",    status: "ACTIVE" as const, isFeatured: false, basePrice: "39.99",  comparePrice: "55.00",  image: img("poloshirt"),     stock: 300 },
      { name: "Smart Home Hub",                slug: "smart-home-hub",                sku: "SH-HB-012", shortDescription: "Control all your smart home devices from one place.",   categorySlug: "smart-devices", brandSlug: "samsung", status: "ACTIVE" as const, isFeatured: false, basePrice: "89.00",  comparePrice: "109.00", image: img("smarthomehub"), stock: 45  },
      { name: "Smartphone Pro Max 256GB",      slug: "smartphone-pro-max-256gb",      sku: "SP-PM-013", shortDescription: '6.7" OLED, triple camera, 5G, all-day battery.',       categorySlug: "smart-devices", brandSlug: "apple",   status: "ACTIVE" as const, isFeatured: true,  basePrice: "1199.00",comparePrice: null,     image: img("smartphone13"),  stock: 35  },
      { name: "Ergonomic Office Chair",        slug: "ergonomic-office-chair",        sku: "CH-EO-014", shortDescription: "Lumbar support, adjustable armrests, mesh back.",        categorySlug: "home-office",   brandSlug: "asus",    status: "ACTIVE" as const, isFeatured: false, basePrice: "249.00", comparePrice: "329.00", image: img("officechair"),   stock: 28  },
      { name: "Premium Laptop Backpack",       slug: "premium-laptop-backpack",       sku: "BP-LP-015", shortDescription: "Water-resistant 30L backpack with USB charging port.",  categorySlug: "accessories",   brandSlug: "nike",    status: "ACTIVE" as const, isFeatured: false, basePrice: "69.99",  comparePrice: "89.99",  image: img("laptopbag"),     stock: 88  },
      { name: "USB-C Hub 10-in-1",             slug: "usb-c-hub-10-in-1",             sku: "HB-UC-016", shortDescription: "HDMI 4K, 3×USB-A, SD card, Ethernet and more.",         categorySlug: "accessories",   brandSlug: "logitech",status: "ACTIVE" as const, isFeatured: false, basePrice: "49.99",  comparePrice: "64.99",  image: img("usbchub"),       stock: 160 },
    ];

    let seeded = 0;
    for (const p of products) {
      // Check both slug AND sku to avoid unique constraint crashes on re-runs
      const exists = await prisma.product.findFirst({
        where: { OR: [{ slug: p.slug }, { sku: p.sku }] },
        select: { id: true },
      });
      if (exists) continue;
      const product = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          shortDescription: p.shortDescription,
          categoryId: catMap[p.categorySlug] ?? null,
          brandId: brandMap[p.brandSlug] ?? null,
          status: p.status,
          isFeatured: p.isFeatured,
          basePrice: p.basePrice,
          comparePrice: p.comparePrice ?? null,
          publishedAt: new Date(),
          images: {
            create: {
              url: p.image,
              altText: p.name,
              isPrimary: true,
              sortOrder: 0,
              provider: "LOCAL",
            },
          },
          inventory: {
            create: {
              quantity: p.stock,
              lowStockThreshold: 10,
              trackInventory: true,
              lastRestockedAt: new Date(),
            },
          },
        },
      });
      void product;
      seeded++;
    }
    if (seeded > 0) console.log(`✅ Demo products seeded (${seeded}) with images + inventory`);
    else console.log("⏭  All demo products already exist, skipping");
  }

  // ===========================================================================
  // Sample FAQs
  // ===========================================================================

  const existingFaqs = await prisma.fAQ.count();
  if (existingFaqs === 0) {
    await prisma.fAQ.createMany({
      data: [
        { question: "How do I track my order?", answer: "You can track your order in your dashboard under Order History. You will also receive email updates with tracking information.", category: "Orders", sortOrder: 1, isActive: true, isFeatured: true },
        { question: "What is your return policy?", answer: "We offer a 14-day hassle-free return policy for all products in original condition. Services can be cancelled up to 24 hours before the scheduled time.", category: "Returns", sortOrder: 2, isActive: true, isFeatured: true },
        { question: "How do I book a service?", answer: "Navigate to the Services section, choose your desired service, select a package if applicable, and click 'Book Now'. You'll receive a confirmation within 24 hours.", category: "Services", sortOrder: 3, isActive: true, isFeatured: true },
        { question: "What payment methods do you accept?", answer: "We accept all major credit/debit cards via Stripe. Additional payment methods may be available depending on your region.", category: "Payments", sortOrder: 4, isActive: true, isFeatured: false },
        { question: "Is my personal information secure?", answer: "Yes. We use industry-standard encryption (TLS 1.3), never store plain passwords, and follow strict data protection practices. Read our Privacy Policy for full details.", category: "Security", sortOrder: 5, isActive: true, isFeatured: false },
      ],
    });
    console.log("✅ Sample FAQs seeded");
  } else {
    console.log("⏭  FAQs already exist, skipping");
  }

  console.log("\n✨ Seed complete.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
