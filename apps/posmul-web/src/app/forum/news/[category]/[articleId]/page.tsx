"use client";

import React from "react";
import { useParams } from "next/navigation";
import { NewsArticleDetailView } from "../../components/NewsArticleDetailView";

export default function NewsArticleDetailPage() {
  const params = useParams();
  const articleId = typeof params?.articleId === "string" ? params.articleId : "";
  return <NewsArticleDetailView articleId={articleId} />;
}
