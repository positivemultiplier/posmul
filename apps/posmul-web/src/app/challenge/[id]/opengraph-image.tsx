import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "edge";
export const alt = "PosMul 맞짱 챌린지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let title = "친구와의 불꽃 튀는 한판 승부!";
  let hostName = "호스트";
  let optionA = { label: "선택 A", ratio: 50 };
  let optionB = { label: "선택 B", ratio: 50 };
  let totalPmp = 1000;

  try {
    const { data } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("title, host_name, options, total_pool_pmp")
      .eq("id", id)
      .single();

    if (data) {
      title = data.title || title;
      hostName = data.host_name || hostName;
      totalPmp = data.total_pool_pmp || totalPmp;
      const opts = (data.options as any[]) || [];
      if (opts.length >= 2) {
        const sum = opts.reduce((acc, c) => acc + (c.pmp || 0), 0) || 1;
        optionA = {
          label: opts[0].label || "선택 A",
          ratio: Math.round(((opts[0].pmp || 0) / sum) * 100) || 50,
        };
        optionB = {
          label: opts[1].label || "선택 B",
          ratio: 100 - optionA.ratio,
        };
      }
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#080a11",
          backgroundImage:
            "radial-gradient(circle at 50% 10%, #1e1b4b 0%, #080a11 65%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          color: "white",
          fontFamily: "sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* 상단: 브랜드 & 도발 뱃지 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: "#38bdf8",
                letterSpacing: "-0.5px",
              }}
            >
              ⚡ PosMul 맞짱 챌린지
            </span>
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#fbbf24",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "2px solid rgba(245, 158, 11, 0.4)",
              padding: "10px 24px",
              borderRadius: "999px",
            }}
          >
            🥊 [{hostName}]님의 도전장!
          </div>
        </div>

        {/* 중앙: 대형 질문 타이틀 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "30px 0",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#94a3b8",
              marginBottom: "10px",
              textTransform: "uppercase",
            }}
          >
            당신의 예측을 선택하고 맞불을 놓으세요!
          </span>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: 1.25,
              color: "#f8fafc",
              wordBreak: "keep-all",
              maxHeight: "130px",
              overflow: "hidden",
            }}
          >
            "{title}"
          </div>
        </div>

        {/* 하단: 양방 대결 게이지 바 & 판돈 정보 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            <span style={{ color: "#38bdf8" }}>
              🔴 {optionA.label} ({optionA.ratio}%)
            </span>
            <span style={{ color: "#fb7185" }}>
              🔵 {optionB.label} ({optionB.ratio}%)
            </span>
          </div>

          {/* 게이지 바 */}
          <div
            style={{
              width: "100%",
              height: "26px",
              backgroundColor: "#1e293b",
              borderRadius: "14px",
              display: "flex",
              overflow: "hidden",
              border: "2px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                width: `${optionA.ratio}%`,
                height: "100%",
                backgroundColor: "#0284c7",
              }}
            />
            <div
              style={{
                width: `${optionB.ratio}%`,
                height: "100%",
                backgroundColor: "#e11d48",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "20px",
              color: "#94a3b8",
              paddingTop: "6px",
            }}
          >
            <span style={{ color: "#facc15", fontWeight: 800 }}>
              💰 총 판돈: {totalPmp.toLocaleString()} PMP
            </span>
            <span style={{ color: "#cbd5e1" }}>
              👉 링크를 눌러 즉시 맞짱 대결 참여!
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

