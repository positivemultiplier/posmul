"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { NewsFeedView } from "../components/NewsFeedView";

function NewsCategoryContent() {
  const params = useParams();
  const category = typeof params?.category === "string" ? params.category : "all";
  return <NewsFeedView initialCategory={category} />;
}

export default function NewsCategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <NewsCategoryContent />
    </Suspense>
  );
}
