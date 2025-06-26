"use client";

import { cn } from "@/shared/utils/cn";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

// Modal 크기 정의
export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const modalSizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
} as const;

// Modal 컴포넌트 Props
export interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

/**
 * 접근성과 애니메이션을 완전 지원하는 Modal 컴포넌트
 *
 * 특징:
 * - Radix UI 기반 완전한 접근성 지원 (포커스 트랩, ARIA 라벨)
 * - Framer Motion 부드러운 애니메이션
 * - ESC 키 및 오버레이 클릭으로 닫기
 * - 5가지 크기 지원 (sm, md, lg, xl, full)
 * - 모바일 반응형 지원
 */
export function Modal({
  children,
  isOpen,
  onClose,
  size = "md",
  title,
  description,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
}: ModalProps) {
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

            {/* Modal 콘텐츠 */}
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1], // easeOutQuart
                }}
                className={cn(
                  "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "bg-white rounded-lg shadow-xl border z-50",
                  "w-full mx-4 p-6",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  modalSizes[size],
                  className
                )}
                onKeyDown={(e) => {
                  if (closeOnEsc && e.key === "Escape") {
                    onClose();
                  }
                }}
              >
                {/* 헤더 영역 */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between mb-4">
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
                          aria-label="모달 닫기"
                        >
                          <X size={16} />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {/* 본문 영역 */}
                <div className="overflow-y-auto max-h-[70vh]">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// Modal 트리거 버튼 컴포넌트
export interface ModalTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

export function ModalTrigger({
  children,
  asChild,
  className,
}: ModalTriggerProps) {
  return (
    <Dialog.Trigger asChild={asChild} className={className}>
      {children}
    </Dialog.Trigger>
  );
}

// 편의성을 위한 컴포넌트들
export const ModalHeader = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={cn("mb-4", className)}>{children}</div>;

export const ModalBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("overflow-y-auto max-h-[60vh]", className)}>
    {children}
  </div>
);

export const ModalFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("flex justify-end gap-2 mt-6 pt-4 border-t", className)}>
    {children}
  </div>
);

// 기본 내보내기
export default Modal;
