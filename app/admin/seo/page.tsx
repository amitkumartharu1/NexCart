"use client";

import { useState } from "react";
import { Save, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminSeoPage() {
  const [form, setForm] = useState({ title: "NexCart — Smart Shopping. Modern Services.", description: "Your premium destination for electronics, gadgets, fashion and professional services.", keywords: "ecommerce, shopping, electronics, nepal" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    toast.success("SEO settings saved");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SEO Settings</h1>
        <p className="text-sm text-foreground-muted mt-1">Manage search engine optimization</p>
      </div>
      <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
        <div className="bg-background rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Default Meta Tags</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Default Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" />
            <p className="text-xs text-foreground-muted mt-1">{form.title.length}/60 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Default Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none" />
            <p className="text-xs text-foreground-muted mt-1">{form.description.length}/160 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Keywords</label>
            <input value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})}
              placeholder="Comma-separated keywords"
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
        </div>
        <div className="bg-background rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-2">Preview</h3>
          <div className="bg-background-subtle rounded-lg p-4">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium truncate">{form.title}</p>
            <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">https://nexcart.com</p>
            <p className="text-foreground-muted text-xs mt-1 line-clamp-2">{form.description}</p>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50">
          <Save size={15} />{saving ? "Saving..." : "Save SEO Settings"}
        </button>
      </form>
    </div>
  );
}
