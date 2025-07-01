"use client";

import Button from "@/shared/components/Button";
import { cn } from "@/shared/utils/cn";
import { ReactNode } from "react";
import { Modal, ModalProps } from "./modal";

// Dialog 버튼 타입
type DialogButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

interface DialogButton {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: DialogButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

// Dialog 컴포넌트 Props
export interface DialogProps extends Omit<ModalProps, "children"> {
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmVariant?: DialogButtonVariant;
  cancelVariant?: DialogButtonVariant;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  hideCancel?: boolean;
  hideConfirm?: boolean;
  additionalButtons?: DialogButton[];
  footerClassName?: string;
}

/**
 * 확인/취소 액션이 포함된 Dialog 컴포넌트
 *
 * 특징:
 * - Modal 컴포넌트 기반으로 구축
 * - 표준 확인/취소 버튼 자동 제공
 * - 추가 버튼 지원
 * - 로딩 상태 지원
 * - 다양한 버튼 스타일 지원
 */
export function Dialog({
  children,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  confirmVariant = "primary",
  cancelVariant = "ghost",
  confirmDisabled = false,
  confirmLoading = false,
  hideCancel = false,
  hideConfirm = false,
  additionalButtons = [],
  footerClassName,
  onClose,
  ...modalProps
}: DialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <Modal {...modalProps} onClose={onClose}>
      {/* 본문 */}
      <div className="mb-6">{children}</div>

      {/* 푸터 - 버튼들 */}
      <div
        className={cn(
          "flex justify-end gap-2 pt-4 border-t border-gray-200",
          footerClassName
        )}
      >
        {/* 추가 버튼들 */}
        {additionalButtons.map((button, index) => (
          <Button
            key={index}
            variant={button.variant || "ghost"}
            onClick={button.onClick}
            disabled={button.disabled}
            loading={button.loading}
            className="min-w-16"
          >
            {button.label}
          </Button>
        ))}

        {/* 취소 버튼 */}
        {!hideCancel && (
          <Button
            variant={cancelVariant}
            onClick={handleCancel}
            className="min-w-16"
          >
            {cancelLabel}
          </Button>
        )}

        {/* 확인 버튼 */}
        {!hideConfirm && (
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={confirmDisabled}
            loading={confirmLoading}
            className="min-w-16"
          >
            {confirmLabel}
          </Button>
        )}
      </div>
    </Modal>
  );
}

// 특수 목적 Dialog 컴포넌트들

/**
 * 경고 Dialog (주의 필요한 액션)
 */
export interface AlertDialogProps extends DialogProps {
  type?: "warning" | "danger" | "info";
}

export function AlertDialog({
  type = "warning",
  confirmLabel = "확인",
  confirmVariant,
  ...props
}: AlertDialogProps) {
  const variants = {
    warning: "primary" as const,
    danger: "danger" as const,
    info: "primary" as const,
  };

  return (
    <Dialog
      {...props}
      confirmLabel={confirmLabel}
      confirmVariant={confirmVariant || variants[type]}
      size="sm"
    />
  );
}

/**
 * 삭제 확인 Dialog
 */
export interface DeleteConfirmDialogProps
  extends Omit<DialogProps, "confirmVariant" | "confirmLabel"> {
  itemName?: string;
}

export function DeleteConfirmDialog({
  itemName = "항목",
  children,
  ...props
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog
      {...props}
      type="danger"
      confirmLabel="삭제"
      title="삭제 확인"
      size="sm"
    >
      {children || (
        <p className="text-gray-600">
          <strong>{itemName}</strong>을(를) 삭제하시겠습니까?
          <br />
          <span className="text-sm text-gray-500">
            이 작업은 되돌릴 수 없습니다.
          </span>
        </p>
      )}
    </AlertDialog>
  );
}

/**
 * 저장 확인 Dialog
 */
export interface SaveConfirmDialogProps
  extends Omit<DialogProps, "confirmVariant" | "confirmLabel"> {
  hasUnsavedChanges?: boolean;
}

export function SaveConfirmDialog({
  hasUnsavedChanges = true,
  children,
  ...props
}: SaveConfirmDialogProps) {
  return (
    <Dialog
      {...props}
      confirmLabel="저장"
      confirmVariant="primary"
      title="변경 사항 저장"
      size="sm"
    >
      {children || (
        <p className="text-gray-600">
          {hasUnsavedChanges ? (
            <>
              저장하지 않은 변경 사항이 있습니다.
              <br />
              저장하시겠습니까?
            </>
          ) : (
            "변경 사항을 저장하시겠습니까?"
          )}
        </p>
      )}
    </Dialog>
  );
}

// 기본 내보내기
export default Dialog;
