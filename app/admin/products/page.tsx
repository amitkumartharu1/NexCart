import { AdminProductsTable } from "@/components/admin/products/ProductsTable";

export const metadata = { title: "Products — Admin | NexCart" };

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-foreground-muted mt-1">Manage your product catalog</p>
        </div>
      </div>
      <AdminProductsTable />
    </div>
  );
}
