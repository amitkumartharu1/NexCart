"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useRef, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link2, ImageIcon,
  Heading1, Heading2, Heading3, Undo, Redo, Code,
  Table as TableIcon, Columns2, Rows3, Trash2, ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />;
}

// ---------------------------------------------------------------------------
// Table dropdown menu
// ---------------------------------------------------------------------------

function TableMenu({ editor }: { editor: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const inTable = editor.isActive("table");

  const items = inTable
    ? [
        { label: "Add column before", action: () => editor.chain().focus().addColumnBefore().run() },
        { label: "Add column after",  action: () => editor.chain().focus().addColumnAfter().run() },
        { label: "Delete column",     action: () => editor.chain().focus().deleteColumn().run() },
        null, // divider
        { label: "Add row before",    action: () => editor.chain().focus().addRowBefore().run() },
        { label: "Add row after",     action: () => editor.chain().focus().addRowAfter().run() },
        { label: "Delete row",        action: () => editor.chain().focus().deleteRow().run() },
        null,
        { label: "Merge cells",       action: () => editor.chain().focus().mergeCells().run() },
        { label: "Split cell",        action: () => editor.chain().focus().splitCell().run() },
        { label: "Toggle header row", action: () => editor.chain().focus().toggleHeaderRow().run() },
        null,
        { label: "🗑 Delete table",   action: () => editor.chain().focus().deleteTable().run(), danger: true },
      ]
    : [
        { label: "Insert 2×2 table",  action: () => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run() },
        { label: "Insert 3×3 table",  action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
        { label: "Insert 4×4 table",  action: () => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run() },
        { label: "Insert 3×5 table",  action: () => editor.chain().focus().insertTable({ rows: 3, cols: 5, withHeaderRow: true }).run() },
      ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Table"
        className={cn(
          "h-7 px-1.5 flex items-center gap-0.5 rounded-md text-sm transition-colors",
          inTable
            ? "bg-primary text-primary-foreground"
            : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
        )}
      >
        <TableIcon size={13} />
        <ChevronDown size={10} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-lg py-1 overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
        >
          {!inTable && (
            <p className="px-3 py-1 text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider">
              Insert Table
            </p>
          )}
          {inTable && (
            <p className="px-3 py-1 text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider">
              Edit Table
            </p>
          )}
          {items.map((item, i) =>
            item === null ? (
              <div key={i} className="my-1 h-px bg-border mx-2" />
            ) : (
              <button
                key={item.label}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  item.action();
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-background-subtle",
                  (item as any).danger ? "text-destructive" : "text-foreground"
                )}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image upload helper
// ---------------------------------------------------------------------------

async function uploadImageFile(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image too large. Maximum 4 MB.");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "nexcart/descriptions");
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as any).error ?? "Upload failed");
  }
  const d = await res.json();
  return d.url as string;
}

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write a detailed product description…",
  minHeight = 240,
  className,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      ImageExt.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-2" },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "focus:outline-none prose prose-sm max-w-none text-foreground",
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) editor.commands.setContent(value);
  }, [value, editor]);

  const handleImageFile = useCallback(async (file: File) => {
    if (!editor || uploadingRef.current) return;
    uploadingRef.current = true;
    const toastId = toast.loading("Uploading image…");
    try {
      const url = await uploadImageFile(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success("Image inserted", { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: toastId });
    } finally {
      uploadingRef.current = false;
    }
  }, [editor]);

  const handleImageButton = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  }, [handleImageFile]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL:", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden bg-background", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-background-subtle/60">
        {/* History */}
        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={13} />
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo size={13} />
        </ToolBtn>

        <Divider />

        {/* Headings */}
        <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={13} />
        </ToolBtn>
        <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={13} />
        </ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={13} />
        </ToolBtn>

        <Divider />

        {/* Marks */}
        <ToolBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={13} />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={13} />
        </ToolBtn>
        <ToolBtn title="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code size={13} />
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={13} />
        </ToolBtn>
        <ToolBtn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={13} />
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={13} />
        </ToolBtn>
        <ToolBtn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={13} />
        </ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn title="Insert link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={13} />
        </ToolBtn>

        {/* Image */}
        <ToolBtn title="Insert image" onClick={handleImageButton}>
          <ImageIcon size={13} />
        </ToolBtn>

        <Divider />

        {/* Table dropdown */}
        <TableMenu editor={editor} />
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="tiptap-editor px-4 py-3 text-sm"
        style={{ minHeight }}
      />

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-border bg-background-subtle/40 flex items-center gap-3">
        <span className="text-[11px] text-foreground-subtle">
          Click <TableIcon size={10} className="inline mx-0.5" /> to insert a table · Click <ImageIcon size={10} className="inline mx-0.5" /> or paste/drag images · Ctrl+Z to undo
        </span>
      </div>
    </div>
  );
}
