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
import { hashPassword } from "../lib/security/password";

const prisma = new PrismaClient();

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
  // Sample FAQs
  // ===========================================================================

  const existingFaqs = await prisma.fAQ.count();
  if (existingFaqs === 0) {
    await prisma.fAQ.createMany({
      data: [
        { question: "How do I track my order?", answer: "You can track your order in your dashboard under Order History. You will also receive email updates with tracking information.", category: "Orders", sortOrder: 1, isActive: true, isFeatured: true },
        { question: "What is your return policy?", answer: "We offer a 30-day hassle-free return policy for all products in original condition. Services can be cancelled up to 24 hours before the scheduled time.", category: "Returns", sortOrder: 2, isActive: true, isFeatured: true },
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
