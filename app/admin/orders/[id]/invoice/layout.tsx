/**
 * Invoice layout — minimal wrapper with print CSS injected.
 * Hides the admin sidebar/header when printing.
 */
export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media print {
          /* Hide admin sidebar, header, and page chrome */
          aside, nav, header, [data-sidebar], [data-header],
          .admin-sidebar, .admin-header { display: none !important; }
          main { padding: 0 !important; background: white !important; }
          body { background: white !important; }
        }
      `}</style>
      {children}
    </>
  );
}
