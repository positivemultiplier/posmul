"use client";

import { Flame, Trophy, Users, Clock } from "lucide-react";

interface GroupMember {
  id: string;
  nickname: string;
  emoji: string;
  studyTimeStr: string;
  isStudying: boolean;
  subject?: string;
  isMe?: boolean;
}

interface YptGroupGridProps {
  myStudySeconds: number;
  myConeEmoji: string;
}

function formatHHMMSS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

const GROUP_MEMBERS: Omit<GroupMember, "isMe">[] = [
  { id: "m1", nickname: "수석합격박", emoji: "🐉", studyTimeStr: "05:14:22", isStudying: true, subject: "공동주택법" },
  { id: "m2", nickname: "동차킹송", emoji: "🦁", studyTimeStr: "04:51:09", isStudying: true, subject: "관리실무" },
  { id: "m4", nickname: "기출파괴자", emoji: "🦉", studyTimeStr: "03:18:45", isStudying: true, subject: "건축법" },
  { id: "m5", nickname: "아침형소장", emoji: "🐱", studyTimeStr: "02:55:11", isStudying: true, subject: "안전소방" },
  { id: "m6", nickname: "서초예비장", emoji: "🦉", studyTimeStr: "02:42:30", isStudying: true, subject: "주택법" },
  { id: "m7", nickname: "회독장인", emoji: "🐉", studyTimeStr: "02:10:04", isStudying: true, subject: "임대정비" },
  { id: "m8", nickname: "퇴근후열공", emoji: "🦁", studyTimeStr: "01:49:18", isStudying: true, subject: "O/X 복습" },
  { id: "m9", nickname: "직장인45", emoji: "🦉", studyTimeStr: "01:33:50", isStudying: false, subject: "휴식 중" },
  { id: "m10", nickname: "주말몰입", emoji: "🐱", studyTimeStr: "01:12:08", isStudying: false, subject: "오프라인" },
  { id: "m11", nickname: "법규마스터", emoji: "🦉", studyTimeStr: "00:54:12", isStudying: false, subject: "휴식 중" },
  { id: "m12", nickname: "내년합격", emoji: "🐱", studyTimeStr: "00:38:44", isStudying: false, subject: "오프라인" },
];

export function YptGroupGrid({ myStudySeconds, myConeEmoji }: YptGroupGridProps) {
  // 3위에 '나' 배치 (총 12명 = 열공중 8명 / 휴식 4명)
  const members: GroupMember[] = [
    GROUP_MEMBERS[0],
    GROUP_MEMBERS[1],
    {
      id: "me",
      nickname: "나 (김소장)",
      emoji: myConeEmoji,
      studyTimeStr: formatHHMMSS(myStudySeconds),
      isStudying: true,
      subject: "관계법규",
      isMe: true,
    },
    ...GROUP_MEMBERS.slice(2),
  ];

  const activeCount = members.filter((m) => m.isStudying).length;

  return (
    <div className="space-y-3">
      {/* 그룹 헤더 */}
      <div className="p-3.5 rounded-2xl bg-[#1A1A22] border border-white/[0.08] flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-white">
              🏢 4050 주택관리사 동차합격방
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
              12/12명
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-[#FF7A59] font-bold flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              <span>현재 {activeCount}명 열공 불빛 ON</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Trophy className="w-3 h-3" />
              <span>내 순위 3위</span>
            </span>
          </div>
        </div>
      </div>

      {/* 열품타 시그니처 3x4 스터디콘 불빛 그리드 */}
      <div className="grid grid-cols-3 gap-2">
        {members.map((member) => (
          <div
            key={member.id}
            className={`rounded-2xl p-2.5 flex flex-col items-center text-center transition relative ${
              member.isStudying
                ? "border border-[#FF5A36] bg-[#FF5A36]/15 shadow-[0_0_20px_rgba(255,90,54,0.12)]"
                : "border border-white/[0.05] bg-[#16161C] opacity-45"
            } ${member.isMe ? "ring-2 ring-amber-400/70" : ""}`}
          >
            {/* 상단 상태 배지 */}
            <div className="w-full flex items-center justify-between text-[9px] font-black mb-1">
              {member.isStudying ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FF5A36] text-white flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 fill-white" />
                  <span>열공중</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  휴식
                </span>
              )}
              {member.isMe && (
                <span className="text-amber-300 font-black">ME</span>
              )}
            </div>

            {/* 스터디콘 캐릭터 */}
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl my-1 ${
                member.isStudying
                  ? "bg-[#121216] border border-[#FF5A36]/50"
                  : "bg-slate-900"
              }`}
            >
              {member.emoji}
            </div>

            {/* 닉네임 & 공부시간 */}
            <div className="text-[11px] font-extrabold text-white truncate w-full">
              {member.nickname}
            </div>
            <div
              className={`font-mono text-[11px] font-black tracking-tight mt-0.5 ${
                member.isStudying ? "text-[#FF8A6B]" : "text-slate-400"
              }`}
            >
              {member.studyTimeStr}
            </div>
            <div className="text-[9.5px] text-slate-400 truncate w-full mt-0.5">
              {member.subject}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

