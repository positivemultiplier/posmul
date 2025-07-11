"use client";

import { cn } from "../../../../../src/shared/utils/cn";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, PanInfo, motion } from "framer-motion";
import { GripHorizontal, X } from "lucide-react";
import { ReactNode, useState } from "react";

// Drawer 높이 설정
export type DrawerHeight = "auto" | "half" | "full";

const drawerHeights: Record<DrawerHeight, string> = {
  auto: "max-h-[50vh]",
  half: "h-[50vh]",
  full: "h-[80vh]",
} as const;

// Drawer 컴포넌트 Props
export interface DrawerProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  height?: DrawerHeight;
  showCloseButton?: boolean;
  showHandle?: boolean;
  closeOnOverlayClick?: boolean;
  snapToTop?: boolean;
  className?: string;
}

/**
 * 모바일 친화적인 Drawer 컴포넌트
 *
 * 특징:
 * - 하단에서 올라오는 애니메이션
 * - 터치 드래그로 닫기 지원
 * - 스냅 투 탑 기능 (전체 화면으로 확장)
 * - 다양한 높이 옵션
 * - 접근성 완전 지원
 */
export function Drawer({
  children,
  isOpen,
  onClose,
  title,
  description,
  height = "auto",
  showCloseButton = true,
  showHandle = true,
  closeOnOverlayClick = true,
  snapToTop = false,
  className,
}: DrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // 드래그 핸들러
  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const shouldClose = info.offset.y > 100 || info.velocity.y > 500;
    const shouldExpand = info.offset.y < -100 && snapToTop && !isExpanded;

    if (shouldClose) {
      onClose();
    } else if (shouldExpand) {
      setIsExpanded(true);
    }

    setDragOffset(0);
  };

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // 아래로 드래그할 때만 움직임 허용
    if (info.offset.y > 0) {
      setDragOffset(info.offset.y);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* 오버레이 */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={closeOnOverlayClick ? onClose : undefined}
              />
            </Dialog.Overlay>

            {/* Drawer 콘텐츠 */}
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ y: "100%" }}
                animate={{
                  y: isExpanded ? 0 : "auto",
                  height: isExpanded ? "100vh" : "auto",
                }}
                exit={{ y: "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 200,
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{
                  y: dragOffset,
                  touchAction: "none", // 스크롤 방지
                }}
                className={cn(
                  "fixed bottom-0 left-0 right-0 z-50",
                  "bg-white rounded-t-lg shadow-xl border-t",
                  "focus:outline-none",
                  isExpanded ? "h-screen" : drawerHeights[height],
                  className
                )}
              >
                {/* 핸들 바 */}
                {showHandle && (
                  <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
                    <GripHorizontal className="text-gray-400" size={20} />
                  </div>
                )}

                {/* 헤더 */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between px-4 pb-4">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-sm text-gray-600 mt-1">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>

                    {showCloseButton && (
                      <Dialog.Close asChild>
                        <button
                          onClick={onClose}
                          className={cn(
                            "rounded-full p-1.5 text-gray-400 hover:text-gray-600",
                            "hover:bg-gray-100 transition-colors",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500"
                          )}
                          aria-label="드로어 닫기"
                        >
                          <X size={16} />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {/* 본문 */}
                <div
                  className={cn(
                    "px-4 pb-4 overflow-y-auto",
                    isExpanded ? "flex-1" : "max-h-[60vh]"
                  )}
                >
                  {children}
                </div>

                {/* 확장 버튼 (snapToTop이 true일 때) */}
                {snapToTop && !isExpanded && (
                  <div className="flex justify-center p-2 border-t">
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      전체 화면으로 보기
                    </button>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// 편의성을 위한 훅
export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
  };
}

// 특수 목적 Drawer 컴포넌트들

/**
 * 액션 시트 - 여러 액션을 나열하는 Drawer
 */
export interface ActionSheetAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface ActionSheetProps extends Omit<DrawerProps, "children"> {
  actions: ActionSheetAction[];
}

export function ActionSheet({ actions, ...drawerProps }: ActionSheetProps) {
  return (
    <Drawer {...drawerProps} height="auto">
      <div className="space-y-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              drawerProps.onClose();
            }}
            disabled={action.disabled}
            className={cn(
              "w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors",
              "hover:bg-gray-50 active:bg-gray-100",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              action.destructive
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-900"
            )}
          >
            {action.icon && (
              <span className="flex-shrink-0">{action.icon}</span>
            )}
            <span className="flex-1">{action.label}</span>
          </button>
        ))}
      </div>
    </Drawer>
  );
}

/**
 * 바텀 시트 - 하단 정보 표시용 Drawer
 */
export interface BottomSheetProps extends DrawerProps {
  scrollable?: boolean;
}

export function BottomSheet({
  scrollable = true,
  children,
  className,
  ...props
}: BottomSheetProps) {
  return (
    <Drawer {...props} className={cn(scrollable && "flex flex-col", className)}>
      <div
        className={cn(
          scrollable ? "flex-1 overflow-y-auto" : "max-h-[60vh] overflow-y-auto"
        )}
      >
        {children}
      </div>
    </Drawer>
  );
}

// 기본 내보내기
export default Drawer;
