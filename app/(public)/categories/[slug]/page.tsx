"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/shop?category=${slug}`);
  }, [slug, router]);

  return null;
}
