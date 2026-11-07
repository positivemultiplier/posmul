"use client";

import React, { useCallback, useRef, useState } from "react";
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
  Loader2,
  Video,
} from "lucide-react";
import { compressImageToWebP, extractYouTubeId } from "@/shared/lib/media/image-compressor";

interface TiptapForumEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onAttachPredictionClick?: () => void;
}

// 서버 스토리지로 파일 업로드 헬퍼
async function uploadImageFile(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/forum/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
    console.error("Upload failed:", data.error);
    return null;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

export function TiptapForumEditor({
  content,
  onChange,
  placeholder = "자유롭게 글을 작성해보세요. 캡처한 이미지(Ctrl+V)나 짤방을 바로 붙여넣을 수 있습니다...",
  onAttachPredictionClick,
}: TiptapForumEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true, // fallback 허용
        HTMLAttributes: {
          class: "rounded-xl max-h-[480px] object-contain my-3 border border-slate-700/60 shadow-lg mx-auto block",
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
          "prose prose-invert max-w-none min-h-[260px] max-h-[550px] overflow-y-auto px-4 py-3 focus:outline-none text-slate-100 text-sm leading-relaxed",
      },
      // 이미지 클립보드 복사+붙여넣기 (Ctrl + V 짤 첨부 시 스토리지 자동 업로드)
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            const file = item.getAsFile();
            if (file) {
              setIsUploading(true);
              compressImageToWebP(file)
                .then((compressed) => uploadImageFile(compressed))
                .then((url) => {
                  setIsUploading(false);
                  if (url) {
                    view.dispatch(
                      view.state.tr.replaceSelectionWith(
                        view.state.schema.nodes.image.create({ src: url })
                      )
                    );
                  } else {
                    alert("이미지 업로드에 실패했습니다. 네트워크 상태를 확인해주세요.");
                  }
                });
              return true; // 기본 텍스트 삽입 방지
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
          setIsUploading(true);
          compressImageToWebP(file)
            .then((compressed) => uploadImageFile(compressed))
            .then((url) => {
              setIsUploading(false);
              if (url) {
                const { tr } = view.state;
                const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos || 0;
                tr.insert(pos, view.state.schema.nodes.image.create({ src: url }));
                view.dispatch(tr);
              }
            });
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
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/") && editor) {
      setIsUploading(true);
      const compressed = await compressImageToWebP(file);
      const url = await uploadImageFile(compressed);
      setIsUploading(false);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        alert("이미지 업로드에 실패했습니다.");
      }
    }
    if (e.target) e.target.value = "";
  };

  // 유튜브 영상 임베드 삽입 헬퍼
  const handleInsertYouTube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("유튜브 동영상 링크를 입력하세요:\n(예: https://www.youtube.com/watch?v=... 또는 https://youtu.be/...)");
    if (!url) return;

    const videoId = extractYouTubeId(url.trim());
    if (!videoId) {
      alert("유효한 유튜브 동영상 주소를 찾을 수 없습니다.");
      return;
    }

    const embedHtml = `<div class="aspect-video w-full max-w-2xl mx-auto my-4 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-black"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><p></p>`;
    editor.chain().focus().insertContent(embedHtml).run();
  }, [editor]);

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
    <div className="w-full rounded-2xl bg-slate-950/90 border border-slate-800/80 overflow-hidden shadow-inner flex flex-col focus-within:border-sky-500/50 transition-colors relative">
      {/* 이미지 업로드 중 로딩 오버레이 */}
      {isUploading && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-sky-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>짤방 이미지를 클라우드에 업로드 중...</span>
        </div>
      )}

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

          {/* 📷 이미지 파일 첨부 버튼 (자동 WebP 압축) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 transition"
            title="사진 첨부 (스마트폰 4K 사진도 WebP로 자동 초경량 압축)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">사진 첨부</span>
          </button>

          {/* 🎬 유튜브 비디오 임베드 버튼 */}
          <button
            type="button"
            onClick={handleInsertYouTube}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 transition"
            title="유튜브 영상 임베드 (링크 붙여넣기로 영상 직접 재생)"
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px]">유튜브 영상</span>
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
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <span>💡 캡처 화면 <strong>Ctrl + V</strong>나 고용량 사진도 브라우저에서 <strong>WebP로 자동 압축</strong>되어 초고속 업로드됩니다.</span>
        <span className="text-emerald-500/80 font-medium">스토리지 95% 비용 절감 가동 중</span>
      </div>
    </div>
  );
}
