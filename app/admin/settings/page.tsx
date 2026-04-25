"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Globe,
  Link2,
  QrCode,
  Upload,
  Eye,
  EyeOff,
  DollarSign,
  ShieldCheck,
  Megaphone,
  Gift,
  Truck,
  CreditCard,
  Key,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

// Social media SVG icons (lucide-react doesn't include brand icons)
function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z" />
    </svg>
  );
}
function YoutubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

interface Settings {
  // Hero
  hero_bg_image: string;
  hero_overlay_opacity: string;
  // General
  site_name: string;
  site_tagline: string;
  site_email: string;
  site_phone: string;
  site_address: string;
  currency: string;
  timezone: string;
  shipping_cost: string;
  free_shipping_threshold: string;
  tax_rate: string;
  // Social
  social_facebook_url: string;
  social_facebook_enabled: string;
  social_instagram_url: string;
  social_instagram_enabled: string;
  social_tiktok_url: string;
  social_tiktok_enabled: string;
  social_youtube_url: string;
  social_youtube_enabled: string;
  // Shipping
  shipping_mode: string; // "free" | "paid"
  // Payment Methods
  payment_cod_enabled: string;
  payment_esewa_enabled: string;
  payment_khalti_qr_enabled: string;
  payment_khalti_enabled: string;
  payment_stripe_enabled: string;
  payment_bank_enabled: string;
  // eSewa QR Payment
  qr_payment_enabled: string;
  qr_payment_account_name: string;
  qr_payment_instructions: string;
  qr_payment_image_url: string;
  // Khalti QR Payment
  khalti_qr_account_name: string;
  khalti_qr_instructions: string;
  khalti_qr_image_url: string;
  // Warranty & Returns
  warranty_period: string;
  warranty_description: string;
  return_period: string;
  return_policy: string;
  // Promo Bar (site-wide announcement)
  promo_bar_enabled: string;
  promo_bar_text: string;
  promo_bar_link: string;
  promo_bar_color: string;
  // Current Offer
  offer_enabled: string;
  offer_title: string;
  offer_description: string;
  offer_badge: string;
  offer_link: string;
  // Giveaway
  giveaway_enabled: string;
  giveaway_title: string;
  giveaway_description: string;
  giveaway_end_date: string;
  // API Keys
  ai_openai_key: string;
  ai_cohere_key: string;
  ai_huggingface_key: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
}

const DEFAULTS: Settings = {
  hero_bg_image: "",
  hero_overlay_opacity: "0.72",
  site_name: "NexCart",
  site_tagline: "Smart Shopping. Modern Services. One Premium Platform.",
  site_email: "",
  site_phone: "",
  site_address: "",
  currency: "NPR",
  timezone: "Asia/Kathmandu",
  shipping_mode: "paid",
  shipping_cost: "150",
  free_shipping_threshold: "5000",
  tax_rate: "13",
  payment_cod_enabled: "true",
  payment_esewa_enabled: "true",
  payment_khalti_qr_enabled: "true",
  payment_khalti_enabled: "false",
  payment_stripe_enabled: "false",
  payment_bank_enabled: "false",
  khalti_qr_account_name: "",
  khalti_qr_instructions: "Scan the QR code below and send the exact amount. Upload your payment screenshot in the next step.",
  khalti_qr_image_url: "",
  social_facebook_url: "",
  social_facebook_enabled: "true",
  social_instagram_url: "",
  social_instagram_enabled: "true",
  social_tiktok_url: "",
  social_tiktok_enabled: "true",
  social_youtube_url: "",
  social_youtube_enabled: "false",
  qr_payment_enabled: "false",
  qr_payment_account_name: "",
  qr_payment_instructions: "Scan the QR code and send the exact amount. Upload your payment screenshot in the next step.",
  qr_payment_image_url: "",
  // Warranty & Returns
  warranty_period: "1 Year",
  warranty_description: "All products come with a manufacturer warranty covering defects in materials and workmanship.",
  return_period: "14 Days",
  return_policy: "You may return unused products in original packaging within 14 days for a full refund.",
  // Promo Bar
  promo_bar_enabled: "false",
  promo_bar_text: "",
  promo_bar_link: "",
  promo_bar_color: "primary",
  // Offer
  offer_enabled: "false",
  offer_title: "",
  offer_description: "",
  offer_badge: "",
  offer_link: "",
  // Giveaway
  giveaway_enabled: "false",
  giveaway_title: "",
  giveaway_description: "",
  giveaway_end_date: "",
  // API Keys
  ai_openai_key: "",
  ai_cohere_key: "",
  ai_huggingface_key: "",
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_phone_number: "",
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrPreview, setQrPreview] = useState<string>("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [khaltiQrPreview, setKhaltiQrPreview] = useState<string>("");
  const khaltiFileRef = useRef<HTMLInputElement>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  function toggleKeyVisibility(field: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field); else next.add(field);
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: { settings: Record<string, string | null> }) => {
        const merged = { ...DEFAULTS };
        for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
          if (data.settings[key] !== undefined && data.settings[key] !== null) {
            merged[key] = data.settings[key] as string;
          }
        }
        setSettings(merged);
        setQrPreview(merged.qr_payment_image_url);
        setKhaltiQrPreview(merged.khalti_qr_image_url);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBool(key: keyof Settings) {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  }

  async function handleKhaltiQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setKhaltiQrPreview(url);
      set("khalti_qr_image_url", url);
    };
    reader.readAsDataURL(file);
    toast.info("Khalti QR image selected. Save settings to persist.");
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setQrPreview(url);
      set("qr_payment_image_url", url); // store as data URL until proper upload is wired
      setUploadingQr(false);
    };
    reader.readAsDataURL(file);
    toast.info("QR image selected. Save settings to persist.");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        group: key.startsWith("hero_")      ? "hero"
             : key.startsWith("social_")   ? "social"
             : key.startsWith("qr_")       ? "payment"
             : key.startsWith("payment_")  ? "payment"
             : key.startsWith("khalti_")   ? "payment"
             : key === "shipping_mode"     ? "shipping"
             : key.startsWith("warranty_") || key.startsWith("return_") ? "policy"
             : key.startsWith("promo_")    ? "promo"
             : key.startsWith("offer_") || key.startsWith("giveaway_") ? "offers"
             : key.startsWith("ai_") || key.startsWith("twilio_") ? "integrations"
             : "general",
        label: key.replace(/_/g, " "),
      }));

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Settings saved successfully");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Manage store configuration, social links, and payment options
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

        {/* ── Hero Background ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Hero Background</h2>
          </div>
          <p className="text-xs text-foreground-muted mt-1">Paste an image URL (or upload via Cloudinary) to replace the default hero background. Leave blank to use the default laptop photo.</p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Background Image URL</label>
            <input
              type="url"
              value={settings.hero_bg_image}
              onChange={(e) => set("hero_bg_image", e.target.value)}
              placeholder="https://example.com/your-hero-image.jpg"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-subtle text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {settings.hero_bg_image && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border h-24 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.hero_bg_image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Overlay Opacity — {Math.round(parseFloat(settings.hero_overlay_opacity || "0.72") * 100)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.01"
              value={settings.hero_overlay_opacity}
              onChange={(e) => set("hero_overlay_opacity", e.target.value)}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-foreground-muted mt-1">
              <span>30% (lighter)</span>
              <span>95% (darker)</span>
            </div>
          </div>
        </section>

        {/* ── General ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">General</h2>
          </div>

          <Field label="Store Name">
            <input value={settings.site_name} onChange={(e) => set("site_name", e.target.value)}
              className={inputCls} />
          </Field>
          <Field label="Footer Tagline">
            <input value={settings.site_tagline} onChange={(e) => set("site_tagline", e.target.value)}
              placeholder="Smart Shopping. Modern Services. One Premium Platform."
              className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Email">
              <input type="email" value={settings.site_email} onChange={(e) => set("site_email", e.target.value)}
                placeholder="admin@nexcart.com" className={inputCls} />
            </Field>
            <Field label="Contact Phone">
              <input type="tel" value={settings.site_phone} onChange={(e) => set("site_phone", e.target.value)}
                placeholder="+977 98XXXXXXXX" className={inputCls} />
            </Field>
          </div>
          <Field label="Store Address">
            <input value={settings.site_address} onChange={(e) => set("site_address", e.target.value)}
              placeholder="Kathmandu, Nepal" className={inputCls} />
          </Field>
          {/* Currency Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-primary" />
                Store Currency
              </span>
            </label>
            <p className="text-xs text-foreground-muted mb-3">
              This currency applies to all prices, totals, and order summaries site-wide.
              Changing this takes effect immediately for all users.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["USD", "NPR"] as const).map((code) => {
                const info = { USD: { symbol: "$", label: "US Dollar", hint: "International" }, NPR: { symbol: "Rs.", label: "Nepalese Rupee", hint: "Nepal (NPT)" } }[code];
                const active = settings.currency === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => set("currency", code)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-foreground-muted hover:border-border-strong"
                    }`}
                  >
                    <span className={`text-2xl font-bold w-8 text-center ${active ? "text-primary" : ""}`}>
                      {info.symbol}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{code}</p>
                      <p className="text-xs opacity-70">{info.label}</p>
                      <p className="text-xs opacity-50">{info.hint}</p>
                    </div>
                    {active && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Timezone">
            <select value={settings.timezone} onChange={(e) => set("timezone", e.target.value)} className={inputCls}>
              <option value="Asia/Kathmandu">Asia/Kathmandu (NPT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </Field>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">VAT / Tax Rate (%)</label>
            <input type="number" value={settings.tax_rate}
              onChange={(e) => set("tax_rate", e.target.value)} className={inputCls} />
            <p className="text-xs text-foreground-muted mt-1">Tax is VAT-inclusive — extracted from displayed prices.</p>
          </div>
        </section>

        {/* ── Shipping ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Truck size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Shipping</h2>
          </div>
          <p className="text-xs text-foreground-muted">
            Control how shipping is charged at checkout.
          </p>

          {/* Mode selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Shipping Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {(["free", "paid"] as const).map((mode) => {
                const active = settings.shipping_mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => set("shipping_mode", mode)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-foreground-muted hover:border-border-strong"
                    }`}
                  >
                    <span className={`text-xl ${active ? "text-primary" : ""}`}>
                      {mode === "free" ? "🎁" : "📦"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold capitalize">{mode === "free" ? "Free Shipping" : "Paid Shipping"}</p>
                      <p className="text-xs opacity-60">
                        {mode === "free" ? "No shipping charge for all orders" : "Charge a fixed shipping fee"}
                      </p>
                    </div>
                    {active && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shipping cost — only shown when paid */}
          {settings.shipping_mode === "paid" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fixed Shipping Cost (Rs.)</label>
              <input
                type="number"
                min="0"
                value={settings.shipping_cost}
                onChange={(e) => set("shipping_cost", e.target.value)}
                className={inputCls}
                placeholder="e.g. 150"
              />
              <p className="text-xs text-foreground-muted mt-1">
                This flat fee is charged on every order.
              </p>
            </div>
          )}

          {settings.shipping_mode === "free" && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              ✓ All customers will receive free shipping. No charge at checkout.
            </div>
          )}
        </section>

        {/* ── Payment Methods ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Payment Methods</h2>
          </div>
          <p className="text-xs text-foreground-muted">
            Enable or disable payment methods shown to customers at checkout.
          </p>

          <div className="space-y-3">
            {(
              [
                { key: "payment_cod_enabled",        label: "Cash on Delivery",    desc: "Pay when order arrives",             icon: "💵" },
                { key: "payment_esewa_enabled",     label: "eSewa QR",           desc: "Customer scans eSewa QR code",       icon: "📱" },
                { key: "payment_khalti_qr_enabled", label: "Khalti QR",          desc: "Customer scans Khalti QR code",      icon: "💜" },
                { key: "payment_khalti_enabled",    label: "Khalti (API)",        desc: "Khalti redirect payment gateway",     icon: "🔗" },
                { key: "payment_stripe_enabled",    label: "Card (Stripe)",       desc: "Visa / Mastercard via Stripe",       icon: "💳" },
                { key: "payment_bank_enabled",      label: "Bank Transfer",       desc: "Direct bank / wire transfer",        icon: "🏦" },
              ] as { key: keyof Settings; label: string; desc: string; icon: string }[]
            ).map(({ key, label, desc, icon }) => {
              const enabled = settings[key] === "true";
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    enabled ? "border-primary/30 bg-primary/5" : "border-border bg-background-subtle"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-foreground-muted">{desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={enabled} onToggle={() => toggleBool(key)} label={label} />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-foreground-muted">
            At least one payment method must be enabled. Disabled methods are hidden from the checkout page.
          </p>
        </section>

        {/* ── Social Media ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Social Media</h2>
          </div>

          <SocialRow
            icon={<FacebookIcon size={18} />}
            label="Facebook"
            url={settings.social_facebook_url}
            enabled={settings.social_facebook_enabled === "true"}
            onUrl={(v) => set("social_facebook_url", v)}
            onToggle={() => toggleBool("social_facebook_enabled")}
          />
          <SocialRow
            icon={<InstagramIcon size={18} />}
            label="Instagram"
            url={settings.social_instagram_url}
            enabled={settings.social_instagram_enabled === "true"}
            onUrl={(v) => set("social_instagram_url", v)}
            onToggle={() => toggleBool("social_instagram_enabled")}
          />
          <SocialRow
            icon={<TikTokIcon size={18} />}
            label="TikTok"
            url={settings.social_tiktok_url}
            enabled={settings.social_tiktok_enabled === "true"}
            onUrl={(v) => set("social_tiktok_url", v)}
            onToggle={() => toggleBool("social_tiktok_enabled")}
          />
          <SocialRow
            icon={<YoutubeIcon size={18} />}
            label="YouTube"
            url={settings.social_youtube_url}
            enabled={settings.social_youtube_enabled === "true"}
            onUrl={(v) => set("social_youtube_url", v)}
            onToggle={() => toggleBool("social_youtube_enabled")}
          />
        </section>

        {/* ── QR Payment ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">QR Code Payment</h2>
            </div>
            <ToggleSwitch
              enabled={settings.qr_payment_enabled === "true"}
              onToggle={() => toggleBool("qr_payment_enabled")}
              label={settings.qr_payment_enabled === "true" ? "Enabled" : "Disabled"}
            />
          </div>

          {settings.qr_payment_enabled === "true" && (
            <>
              <Field label="Account / Merchant Name">
                <input value={settings.qr_payment_account_name}
                  onChange={(e) => set("qr_payment_account_name", e.target.value)}
                  placeholder="Your name or merchant ID" className={inputCls} />
              </Field>

              <Field label="Payment Instructions">
                <textarea
                  value={settings.qr_payment_instructions}
                  onChange={(e) => set("qr_payment_instructions", e.target.value)}
                  rows={3}
                  className={inputCls + " resize-none"}
                />
              </Field>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  QR Code Image
                </label>
                <div className="flex items-start gap-4">
                  {qrPreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrPreview}
                        alt="QR Code preview"
                        className="w-32 h-32 object-contain rounded-lg border border-border"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-foreground-muted">
                      <QrCode size={32} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Upload size={14} />
                      {qrPreview ? "Change QR" : "Upload QR"}
                    </button>
                    {qrPreview && (
                      <button
                        type="button"
                        onClick={() => { setQrPreview(""); set("qr_payment_image_url", ""); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-foreground-muted">PNG or JPG, max 2 MB</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleQrUpload}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Khalti QR Payment ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={16} className="text-purple-500" />
            <h2 className="font-semibold text-foreground">Khalti QR Payment</h2>
            <span className="text-xs text-foreground-muted ml-1">— enable "Khalti QR" in Payment Methods above</span>
          </div>
          <p className="text-xs text-foreground-muted">
            Upload your Khalti QR code. Customers will scan and pay manually, then submit their transaction ID.
          </p>

          <Field label="Account / Merchant Name">
            <input value={settings.khalti_qr_account_name}
              onChange={(e) => set("khalti_qr_account_name", e.target.value)}
              placeholder="Your name or Khalti merchant ID" className={inputCls} />
          </Field>

          <Field label="Payment Instructions">
            <textarea
              value={settings.khalti_qr_instructions}
              onChange={(e) => set("khalti_qr_instructions", e.target.value)}
              rows={3}
              className={inputCls + " resize-none"}
            />
          </Field>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Khalti QR Code Image
            </label>
            <div className="flex items-start gap-4">
              {khaltiQrPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={khaltiQrPreview}
                    alt="Khalti QR Code preview"
                    className="w-32 h-32 object-contain rounded-lg border border-border"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-800 flex items-center justify-center text-purple-400">
                  <QrCode size={32} />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => khaltiFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <Upload size={14} />
                  {khaltiQrPreview ? "Change QR" : "Upload QR"}
                </button>
                {khaltiQrPreview && (
                  <button
                    type="button"
                    onClick={() => { setKhaltiQrPreview(""); set("khalti_qr_image_url", ""); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-foreground-muted">PNG or JPG, max 2 MB</p>
                <input
                  ref={khaltiFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleKhaltiQrUpload}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Warranty & Returns ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Warranty &amp; Returns Policy</h2>
          </div>
          <p className="text-xs text-foreground-muted -mt-1">
            This shows on product pages and the policies section.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Warranty Period" hint="e.g. 1 Year, 6 Months">
              <input value={settings.warranty_period}
                onChange={(e) => set("warranty_period", e.target.value)}
                placeholder="1 Year" className={inputCls} />
            </Field>
            <Field label="Return Period" hint="e.g. 30 Days, 14 Days">
              <input value={settings.return_period}
                onChange={(e) => set("return_period", e.target.value)}
                placeholder="30 Days" className={inputCls} />
            </Field>
          </div>
          <Field label="Warranty Description">
            <textarea rows={3} value={settings.warranty_description}
              onChange={(e) => set("warranty_description", e.target.value)}
              placeholder="Describe what the warranty covers..."
              className={inputCls + " resize-none"} />
          </Field>
          <Field label="Return Policy">
            <textarea rows={3} value={settings.return_policy}
              onChange={(e) => set("return_policy", e.target.value)}
              placeholder="Describe your return policy..."
              className={inputCls + " resize-none"} />
          </Field>
        </section>

        {/* ── Promo Bar ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Announcement Bar</h2>
            </div>
            <ToggleSwitch
              enabled={settings.promo_bar_enabled === "true"}
              onToggle={() => toggleBool("promo_bar_enabled")}
              label="Promo bar"
            />
          </div>
          <p className="text-xs text-foreground-muted -mt-1">
            Shows a colored strip at the very top of every page. Great for sales, announcements, or alerts.
          </p>
          {settings.promo_bar_enabled === "true" && (
            <>
              <Field label="Announcement Text">
                <input value={settings.promo_bar_text}
                  onChange={(e) => set("promo_bar_text", e.target.value)}
                  placeholder="🎉 Grand Sale — Up to 50% off this week!" className={inputCls} />
              </Field>
              <Field label="Link URL (optional)" hint="Where clicking the bar takes users">
                <input type="url" value={settings.promo_bar_link}
                  onChange={(e) => set("promo_bar_link", e.target.value)}
                  placeholder="https://nexcart.com/shop?filter=sale" className={inputCls} />
              </Field>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bar Color</label>
                <div className="flex gap-3 flex-wrap">
                  {(["primary","amber","red","green"] as const).map((c) => {
                    const bg = {primary:"bg-primary",amber:"bg-amber-500",red:"bg-red-500",green:"bg-emerald-600"}[c];
                    const label = {primary:"Brand",amber:"Amber",red:"Red",green:"Green"}[c];
                    return (
                      <button key={c} type="button" onClick={() => set("promo_bar_color", c)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${settings.promo_bar_color === c ? "border-ring ring-2 ring-ring/30" : "border-border"}`}>
                        <span className={`w-4 h-4 rounded-full ${bg}`} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Offers & Giveaway ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Offers &amp; Giveaway</h2>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            These appear as cards on the homepage between category and trending sections.
          </p>

          {/* Current Offer */}
          <div className="border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground text-sm">Current Offer</p>
              <ToggleSwitch
                enabled={settings.offer_enabled === "true"}
                onToggle={() => toggleBool("offer_enabled")}
                label="Offer"
              />
            </div>
            {settings.offer_enabled === "true" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Offer Title">
                    <input value={settings.offer_title}
                      onChange={(e) => set("offer_title", e.target.value)}
                      placeholder="Weekend Special" className={inputCls} />
                  </Field>
                  <Field label="Badge Label" hint='Shown as a tag (e.g. "Limited Time")'>
                    <input value={settings.offer_badge}
                      onChange={(e) => set("offer_badge", e.target.value)}
                      placeholder="Limited Time" className={inputCls} />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea rows={2} value={settings.offer_description}
                    onChange={(e) => set("offer_description", e.target.value)}
                    placeholder="Get 20% off all electronics this weekend only!"
                    className={inputCls + " resize-none"} />
                </Field>
                <Field label="Link URL (optional)">
                  <input type="url" value={settings.offer_link}
                    onChange={(e) => set("offer_link", e.target.value)}
                    placeholder="https://nexcart.com/shop" className={inputCls} />
                </Field>
              </>
            )}
          </div>

          {/* Giveaway */}
          <div className="border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground text-sm">Giveaway</p>
              <ToggleSwitch
                enabled={settings.giveaway_enabled === "true"}
                onToggle={() => toggleBool("giveaway_enabled")}
                label="Giveaway"
              />
            </div>
            {settings.giveaway_enabled === "true" && (
              <>
                <Field label="Giveaway Title">
                  <input value={settings.giveaway_title}
                    onChange={(e) => set("giveaway_title", e.target.value)}
                    placeholder="Win a Free iPhone!" className={inputCls} />
                </Field>
                <Field label="Description">
                  <textarea rows={2} value={settings.giveaway_description}
                    onChange={(e) => set("giveaway_description", e.target.value)}
                    placeholder="Follow us and share this post to enter..."
                    className={inputCls + " resize-none"} />
                </Field>
                <Field label="End Date & Time" hint="Countdown timer shows on homepage">
                  <input type="datetime-local" value={settings.giveaway_end_date}
                    onChange={(e) => set("giveaway_end_date", e.target.value)}
                    className={inputCls} />
                </Field>
              </>
            )}
          </div>
        </section>

        {/* ── API Keys & Integrations ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <Key size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">API Keys &amp; Integrations</h2>
          </div>
          <p className="text-xs text-foreground-muted -mt-2">
            Keys stored here are used when environment variables are not set. Values are masked — click the eye icon to reveal.
            Never share these keys publicly.
          </p>

          {/* AI Providers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">🤖 AI Providers</span>
              <span className="text-xs text-foreground-muted">Priority: OpenAI → Cohere → HuggingFace → rule-based</span>
            </div>

            <ApiKeyField
              label="OpenAI API Key"
              hint={<>Get yours at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">platform.openai.com/api-keys</a>. Uses gpt-3.5-turbo by default.</>}
              placeholder="sk-proj-••••••••••••••••••••••••"
              value={settings.ai_openai_key}
              visible={visibleKeys.has("ai_openai_key")}
              onChange={(v) => set("ai_openai_key", v)}
              onToggle={() => toggleKeyVisibility("ai_openai_key")}
            />

            <ApiKeyField
              label="Cohere API Key"
              hint={<>Get yours at <a href="https://dashboard.cohere.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">dashboard.cohere.com</a>. Uses command-r model. Free tier available.</>}
              placeholder="••••••••••••••••••••••••••••••••"
              value={settings.ai_cohere_key}
              visible={visibleKeys.has("ai_cohere_key")}
              onChange={(v) => set("ai_cohere_key", v)}
              onToggle={() => toggleKeyVisibility("ai_cohere_key")}
            />

            <ApiKeyField
              label="HuggingFace API Token"
              hint={<>Get yours at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">huggingface.co/settings/tokens</a>. Free inference API included.</>}
              placeholder="hf_••••••••••••••••••••••••••••••"
              value={settings.ai_huggingface_key}
              visible={visibleKeys.has("ai_huggingface_key")}
              onChange={(v) => set("ai_huggingface_key", v)}
              onToggle={() => toggleKeyVisibility("ai_huggingface_key")}
            />
          </div>

          <div className="border-t border-border" />

          {/* Twilio SMS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-foreground-muted" />
              <span className="text-sm font-semibold text-foreground">Twilio SMS / WhatsApp</span>
              <span className="text-xs text-foreground-muted">For AI chat via SMS &amp; WhatsApp</span>
            </div>

            <p className="text-xs text-foreground-muted bg-background-subtle rounded-lg px-3 py-2 border border-border">
              📱 Set your Twilio webhook URL to: <code className="text-primary font-mono text-[11px]">https://your-domain.com/api/sms/webhook</code>
              <br />Get credentials at <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">console.twilio.com</a> (free trial available).
            </p>

            <ApiKeyField
              label="Account SID"
              hint="Found on your Twilio Console dashboard. Starts with AC..."
              placeholder="AC••••••••••••••••••••••••••••••••"
              value={settings.twilio_account_sid}
              visible={visibleKeys.has("twilio_account_sid")}
              onChange={(v) => set("twilio_account_sid", v)}
              onToggle={() => toggleKeyVisibility("twilio_account_sid")}
            />

            <ApiKeyField
              label="Auth Token"
              hint="Found below the Account SID on your Twilio Console dashboard."
              placeholder="••••••••••••••••••••••••••••••••"
              value={settings.twilio_auth_token}
              visible={visibleKeys.has("twilio_auth_token")}
              onChange={(v) => set("twilio_auth_token", v)}
              onToggle={() => toggleKeyVisibility("twilio_auth_token")}
            />

            <Field label="Twilio Phone Number" hint="Your Twilio number in E.164 format, e.g. +12345678900">
              <input
                type="text"
                value={settings.twilio_phone_number}
                onChange={(e) => set("twilio_phone_number", e.target.value)}
                placeholder="+12345678900"
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-foreground-muted mt-1">{hint}</p>}
    </div>
  );
}

function SocialRow({
  icon,
  label,
  url,
  enabled,
  onUrl,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  url: string;
  enabled: boolean;
  onUrl: (v: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-8 flex justify-center">{icon}</div>
      <div className="flex-1">
        <input
          type="url"
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          placeholder={`https://www.${label.toLowerCase()}.com/yourpage`}
          className={inputCls}
        />
      </div>
      <ToggleSwitch enabled={enabled} onToggle={onToggle} label={label} />
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Toggle ${label}`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        enabled
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-muted border-border text-foreground-muted"
      }`}
    >
      {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
      {enabled ? "On" : "Off"}
    </button>
  );
}

function ApiKeyField({
  label,
  hint,
  placeholder,
  value,
  visible,
  onChange,
  onToggle,
}: {
  label: string;
  hint: React.ReactNode;
  placeholder: string;
  value: string;
  visible: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={inputCls + " pr-10 font-mono text-xs"}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide key" : "Show key"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {value && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
            ✓ Key saved
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] text-destructive hover:underline"
          >
            Clear
          </button>
        </div>
      )}
      {hint && <p className="text-xs text-foreground-muted mt-1">{hint}</p>}
    </div>
  );
}

