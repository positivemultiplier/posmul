import { createClient } from "@/lib/supabase/server";
import { getGalleryPostDetailAction } from "../actions/gallery.actions";
import { ForumPostDetailClient } from "./ForumPostDetailClient";

interface ForumPostDetailPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export default async function ForumPostDetailPage({ params }: ForumPostDetailPageProps) {
  const { postId } = await params;
  const supabase = await createClient();

  // 서버에서 게시글+댓글과 현재 유저 세션을 병렬로 즉시 로드 (클라이언트 마운트 후 추가 왕복 제거)
  const [detailRes, userRes] = await Promise.all([
    getGalleryPostDetailAction(postId),
    supabase.auth.getUser(),
  ]);

  const user = userRes.data?.user ?? null;
  const isAdmin = user?.app_metadata?.role === "admin";

  return (
    <ForumPostDetailClient
      postId={postId}
      initialPost={detailRes.success ? (detailRes.post ?? null) : null}
      initialComments={detailRes.success ? detailRes.comments : []}
      initialUserId={user?.id ?? null}
      initialIsAdmin={Boolean(isAdmin)}
    />
  );
}
