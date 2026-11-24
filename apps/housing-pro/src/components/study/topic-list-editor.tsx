"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  EyeOff,
  GripVertical,
  ListTree,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { StudyTopicNode } from "@/data/study-textbooks";
import type { TopicOverrideItem } from "@/lib/study-curriculum-store";
import { getMutedTopicColor, TOPIC_MUTED_PALETTE } from "@/lib/study-theme";

interface TopicListItem {
  unitId: string;
  topic: StudyTopicNode;
}

interface TopicListEditorProps {
  subjectId: string;
  firstUnitId?: string;
  topics: TopicListItem[];
  onAddTopic: (unitId: string, title: string, keyword: string, minutes: number) => void;
  onUpdateTopic: (topicId: string, patch: TopicOverrideItem) => void;
  onDeleteCustomTopic: (unitId: string, topicId: string) => void;
  onHideTopic: (topicId: string) => void;
  onReorderTopics: (subjectId: string, orderedTopicIds: string[]) => void;
}

/**
 * 과목 내 단원 편집기:
 * - 드래그 앤 드롭(PC) + 위/아래 버튼(모바일)으로 단원 순서 변경
 * - 단원별 개별 저채도 컬러 선택 (기본 자동 분산)
 * - 단원명 인라인 수정 & 소단원(subItems) 추가/삭제
 */
export function TopicListEditor({
  subjectId,
  firstUnitId,
  topics,
  onAddTopic,
  onUpdateTopic,
  onDeleteCustomTopic,
  onHideTopic,
  onReorderTopics,
}: TopicListEditorProps) {
  const [newTopicDraft, setNewTopicDraft] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [colorPickerTopicId, setColorPickerTopicId] = useState<string | null>(null);
  const [subEditorTopicId, setSubEditorTopicId] = useState<string | null>(null);
  const [subItemDraft, setSubItemDraft] = useState("");
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [dragOverTopicId, setDragOverTopicId] = useState<string | null>(null);

  const commitReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= topics.length) return;
    const ids = topics.map((t) => t.topic.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    onReorderTopics(subjectId, ids);
  };

  const handleSaveTopicTitle = (topicId: string) => {
    const clean = editTopicTitle.trim();
    if (!clean) return;
    onUpdateTopic(topicId, { title: clean });
    setEditingTopicId(null);
  };

  const handleAddSubItem = (topic: StudyTopicNode) => {
    const clean = subItemDraft.trim();
    if (!clean) return;
    const nextSubs = [...(topic.subItems || []), clean];
    onUpdateTopic(topic.id, { subItems: nextSubs });
    setSubItemDraft("");
  };

  const handleRemoveSubItem = (topic: StudyTopicNode, subIdx: number) => {
    const nextSubs = (topic.subItems || []).filter((_, i) => i !== subIdx);
    onUpdateTopic(topic.id, { subItems: nextSubs });
  };

  return (
    <div className="px-3.5 pb-3.5 pt-3 border-t border-[var(--hp-border)] bg-[var(--hp-bg)]/50 space-y-2.5">
      {firstUnitId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = newTopicDraft.trim();
            if (!clean) return;
            onAddTopic(firstUnitId, clean, clean.slice(0, 6), 30);
            setNewTopicDraft("");
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={newTopicDraft}
            onChange={(e) => setNewTopicDraft(e.target.value)}
            placeholder="이 과목에 단원 추가..."
            className="flex-1 h-8 px-2.5 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
          />
          <button
            type="submit"
            disabled={!newTopicDraft.trim()}
            className="h-8 px-2.5 rounded-md bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40"
          >
            추가
          </button>
        </form>
      )}

      <div className="text-[10.5px] text-[var(--hp-text-3)]">
        드래그 또는 화살표로 순서 변경 · 컬러 도트 탭으로 단원 색상 지정 · 목록 아이콘으로 소단원 관리
      </div>

      <ul className="divide-y divide-[var(--hp-border)]">
        {topics.map(({ unitId, topic }, idx) => {
          const topicColor = getMutedTopicColor(topic.color, idx);
          const isEditing = editingTopicId === topic.id;
          const isCustom = topic.id.startsWith("custom-");
          const isColorOpen = colorPickerTopicId === topic.id;
          const isSubOpen = subEditorTopicId === topic.id;
          const isDragOver = dragOverTopicId === topic.id && draggedTopicId !== topic.id;
          const subItems = topic.subItems || [];

          return (
            <li
              key={topic.id}
              draggable={!isEditing}
              onDragStart={() => setDraggedTopicId(topic.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTopicId(topic.id);
              }}
              onDragLeave={() => {
                if (dragOverTopicId === topic.id) setDragOverTopicId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTopicId) {
                  const fromIdx = topics.findIndex((t) => t.topic.id === draggedTopicId);
                  commitReorder(fromIdx, idx);
                }
                setDraggedTopicId(null);
                setDragOverTopicId(null);
              }}
              onDragEnd={() => {
                setDraggedTopicId(null);
                setDragOverTopicId(null);
              }}
              className={`py-2.5 space-y-2 transition ${
                isDragOver ? "border-t-2 border-t-[var(--hp-accent)]" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 text-xs">
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={editTopicTitle}
                      onChange={(e) => setEditTopicTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTopicTitle(topic.id);
                      }}
                      className="flex-1 h-7 px-2 rounded bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveTopicTitle(topic.id)}
                      className="h-7 px-2 rounded bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-[11px] font-medium"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTopicId(null)}
                      className="p-1 text-[var(--hp-text-3)]"
                      aria-label="취소"
                    >
                      <X className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <GripVertical className="w-3.5 h-3.5 stroke-[1.5] text-[var(--hp-text-3)] cursor-grab shrink-0" />
                      <button
                        type="button"
                        onClick={() => setColorPickerTopicId(isColorOpen ? null : topic.id)}
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/15 hover:scale-110 transition"
                        style={{ backgroundColor: topicColor }}
                        title="단원 색상 변경"
                        aria-label={`${topic.title} 색상 변경`}
                      />
                      <span className="truncate text-[var(--hp-text)]">
                        {topic.topicNo ? `${topic.topicNo}. ` : ""}
                        {topic.title}
                      </span>
                      {subItems.length > 0 && (
                        <span className="text-[10px] hp-tabular text-[var(--hp-text-3)] shrink-0">
                          ({subItems.length})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => commitReorder(idx, idx - 1)}
                        className="p-1 rounded text-[var(--hp-text-3)] hover:text-[var(--hp-text)] disabled:opacity-25"
                        title="위로 이동"
                        aria-label="위로 이동"
                      >
                        <ArrowUp className="w-3 h-3 stroke-[1.5]" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === topics.length - 1}
                        onClick={() => commitReorder(idx, idx + 1)}
                        className="p-1 rounded text-[var(--hp-text-3)] hover:text-[var(--hp-text)] disabled:opacity-25"
                        title="아래로 이동"
                        aria-label="아래로 이동"
                      >
                        <ArrowDown className="w-3 h-3 stroke-[1.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSubEditorTopicId(isSubOpen ? null : topic.id);
                          setSubItemDraft("");
                        }}
                        className={`p-1 rounded transition ${
                          isSubOpen || subItems.length > 0
                            ? "text-[var(--hp-text)]"
                            : "text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                        }`}
                        title="소단원 관리"
                        aria-label={`${topic.title} 소단원 관리`}
                      >
                        <ListTree className="w-3 h-3 stroke-[1.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTopicId(topic.id);
                          setEditTopicTitle(topic.title);
                        }}
                        className="p-1 rounded text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                        title="단원명 수정"
                        aria-label={`${topic.title} 수정`}
                      >
                        <Pencil className="w-3 h-3 stroke-[1.5]" />
                      </button>
                      {isCustom ? (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomTopic(unitId, topic.id)}
                          className="p-1 rounded text-[var(--hp-text-3)] hover:text-[var(--hp-danger)]"
                          title="커스텀 단원 삭제"
                          aria-label={`${topic.title} 삭제`}
                        >
                          <Trash2 className="w-3 h-3 stroke-[1.5]" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onHideTopic(topic.id)}
                          className="p-1 rounded text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                          title="단원 숨기기"
                          aria-label={`${topic.title} 숨기기`}
                        >
                          <EyeOff className="w-3 h-3 stroke-[1.5]" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 단원별 10색 컬러 선택 팔레트 */}
              {isColorOpen && (
                <div className="pl-5 flex items-center gap-1.5 flex-wrap">
                  {TOPIC_MUTED_PALETTE.map((hex) => {
                    const selected = topicColor.toUpperCase() === hex.toUpperCase();
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          onUpdateTopic(topic.id, { color: hex });
                          setColorPickerTopicId(null);
                        }}
                        className={`w-4 h-4 rounded-full transition ${
                          selected
                            ? "ring-2 ring-offset-2 ring-offset-[var(--hp-bg)] ring-[var(--hp-accent)]"
                            : "opacity-65 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: hex }}
                        aria-label={`단원 색상 ${hex}`}
                      />
                    );
                  })}
                </div>
              )}

              {/* 소단원(subItems) 인라인 관리 */}
              {isSubOpen && (
                <div className="ml-5 p-2.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2">
                  <div className="text-[10.5px] text-[var(--hp-text-3)]">
                    소단원 목록 ({subItems.length})
                  </div>
                  {subItems.length > 0 && (
                    <ul className="space-y-1">
                      {subItems.map((sub, sIdx) => (
                        <li
                          key={`${sub}-${sIdx}`}
                          className="flex items-center justify-between gap-2 text-[11px] text-[var(--hp-text-2)]"
                        >
                          <span className="truncate">· {sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubItem(topic, sIdx)}
                            className="p-0.5 text-[var(--hp-text-3)] hover:text-[var(--hp-danger)] shrink-0"
                            aria-label="소단원 삭제"
                          >
                            <X className="w-3 h-3 stroke-[1.5]" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddSubItem(topic);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={subItemDraft}
                      onChange={(e) => setSubItemDraft(e.target.value)}
                      placeholder="소단원 입력 후 Enter (예: 제1절 총칙)"
                      className="flex-1 h-7 px-2 rounded bg-[var(--hp-bg)] border border-[var(--hp-border)] text-[11px] text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!subItemDraft.trim()}
                      className="h-7 px-2 rounded bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-[11px] font-medium disabled:opacity-40 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3 stroke-[2]" />
                      <span>추가</span>
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
