"use client";

import React, { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Undo,
  Redo,
} from "lucide-react";

interface TiptapForumEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onAttachPredictionClick?: () => void;
}

export function TiptapForumEditor({
  content,
  onChange,
  placeholder = "자유롭게 글을 작성해보세요. 캡처한 이미지(Ctrl+V)나 짤방을 바로 붙여넣을 수 있습니다...",
  onAttachPredictionClick,
}: TiptapForumEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true, // 로컬 캡처 및 복사-붙여넣기 짤 즉시 허용
        HTMLAttributes: {
          class: "rounded-xl max-h-[480px] object-contain my-3 border border-slate-700/60 shadow-lg mx-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-sky-400 underline font-semibold hover:text-sky-300",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-slate-600 before:float-left before:pointer-events-none before:h-0",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[220px] max-h-[500px] overflow-y-auto px-4 py-3 focus:outline-none text-slate-100 text-sm leading-relaxed",
      },
      // 이미지 클립보드 복사+붙여넣기 (Ctrl + V 짤 첨부 핸들러)
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const base64 = readerEvent.target?.result as string;
                if (base64) {
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({ src: base64 })
                    )
                  );
                }
              };
              reader.readAsDataURL(file);
              return true; // 에디터 기본 텍스트 붙여넣기 방지 및 이미지 삽입 완료
            }
          }
        }
        return false;
      },
      // 파일 드래그 앤 드롭 지원
      handleDrop: (view, event) => {
        const hasFiles = event.dataTransfer?.files?.length;
        if (hasFiles && event.dataTransfer.files[0].type.startsWith("image/")) {
          const file = event.dataTransfer.files[0];
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const base64 = readerEvent.target?.result as string;
            if (base64) {
              const { tr } = view.state;
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos || 0;
              tr.insert(pos, view.state.schema.nodes.image.create({ src: base64 }));
              view.dispatch(tr);
            }
          };
          reader.readAsDataURL(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 로컬 파일 업로드 버튼 클릭 시
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/") && editor) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        if (base64) {
          editor.chain().focus().setImage({ src: base64 }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = "";
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("링크 URL을 입력하세요:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="w-full min-h-[220px] rounded-xl bg-slate-950 border border-slate-800 p-4 text-slate-600 text-xs flex items-center justify-center">
        에디터를 로딩하고 있습니다...
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-slate-950/90 border border-slate-800/80 overflow-hidden shadow-inner flex flex-col focus-within:border-sky-500/50 transition-colors">
      {/* 숨겨진 이미지 파일 인풋 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 🛠️ Tiptap 상단 툴바 */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b border-slate-800/80 bg-slate-900/60 text-slate-400">
        <div className="flex flex-wrap items-center gap-1">
          {/* 볼드 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("bold") ? "bg-slate-800 text-sky-400 font-bold" : ""
            }`}
            title="굵게 (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* 기울임 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("italic") ? "bg-slate-800 text-sky-400" : ""
            }`}
            title="기울임 (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* 취소선 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("strike") ? "bg-slate-800 text-sky-400" : ""
            }`}
            title="취소선"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* 제목 1 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("heading", { level: 1 }) ? "bg-slate-800 text-sky-400 font-bold" : ""
            }`}
            title="큰 제목"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          {/* 제목 2 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("heading", { level: 2 }) ? "bg-slate-800 text-sky-400 font-bold" : ""
            }`}
            title="중간 제목"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* 불릿 리스트 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("bulletList") ? "bg-slate-800 text-sky-400" : ""
            }`}
            title="목록"
          >
            <List className="w-4 h-4" />
          </button>

          {/* 숫자 리스트 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("orderedList") ? "bg-slate-800 text-sky-400" : ""
            }`}
            title="순서 목록"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* 인용구 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("blockquote") ? "bg-slate-800 text-sky-400" : ""
            }`}
            title="인용구"
          >
            <Quote className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* 📷 이미지 파일 첨부 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 transition"
            title="사진 첨부 (클립보드 짤방 Ctrl+V도 가능)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">사진/짤</span>
          </button>

          {/* 🔗 링크 */}
          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition ${
              editor.isActive("link") ? "bg-slate-800 text-sky-400" : ""
            }`}
            title="하이퍼링크 추가"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 우측 보조 도구 (예측 연동 + 실행 취소) */}
        <div className="flex items-center gap-1">
          {onAttachPredictionClick && (
            <button
              type="button"
              onClick={onAttachPredictionClick}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition shadow-sm"
              title="토론할 예측 게임을 본문에 임베드"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px]">예측 연동</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
            title="다시 실행 (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 📝 본문 에디터 영역 */}
      <EditorContent editor={editor} />

      {/* 하단 단축 안내 */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
        <span>💡 캡처 화면 복사 후 <strong>Ctrl + V</strong>로 바로 이미지를 붙여넣을 수 있습니다.</span>
        <span>Markdown 문법 지원</span>
      </div>
    </div>
  );
}

