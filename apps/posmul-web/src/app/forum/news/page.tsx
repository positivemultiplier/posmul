"use client";

import React, { Suspense } from "react";
import { NewsFeedView } from "./components/NewsFeedView";

export default function ForumNewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <NewsFeedView />
    </Suspense>
  );
}
