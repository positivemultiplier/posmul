"use client";

import Button from "../../../../../src/shared/ui/components/base/Button";
import { Download, Edit, Settings, Share, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  ActionSheet,
  AlertDialog,
  BottomSheet,
  DeleteConfirmDialog,
  Dialog,
  Drawer,
  Modal,
  useDrawer,
} from "./index";

/**
 * Modal 시스템 사용법 데모 컴포넌트
 *
 * 다양한 Modal 타입과 사용 사례를 보여줍니다:
 * - 기본 Modal
 * - 확인/취소 Dialog
 * - 삭제 확인 Dialog
 * - 경고 Dialog
 * - 모바일 Drawer
 * - Action Sheet
 * - Bottom Sheet
 */
export function ModalExamples() {
  // Modal 상태 관리
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  // Drawer 훅 사용 예제
  const mobileDrawer = useDrawer();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Modal 시스템 예제</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* 기본 Modal */}
        <Button onClick={() => setBasicModalOpen(true)}>기본 Modal</Button>

        {/* Dialog */}
        <Button onClick={() => setDialogOpen(true)}>확인/취소 Dialog</Button>

        {/* 삭제 확인 Dialog */}
        <Button variant="danger" onClick={() => setDeleteDialogOpen(true)}>
          삭제 확인 Dialog
        </Button>

        {/* 경고 Dialog */}
        <Button variant="primary" onClick={() => setAlertDialogOpen(true)}>
          경고 Dialog
        </Button>

        {/* Drawer */}
        <Button onClick={() => setDrawerOpen(true)}>모바일 Drawer</Button>

        {/* Action Sheet */}
        <Button onClick={() => setActionSheetOpen(true)}>Action Sheet</Button>

        {/* Bottom Sheet */}
        <Button onClick={() => setBottomSheetOpen(true)}>Bottom Sheet</Button>

        {/* 훅 사용 Drawer */}
        <Button onClick={mobileDrawer.open}>훅 Drawer</Button>
      </div>

      {/* 기본 Modal */}
      <Modal
        isOpen={basicModalOpen}
        onClose={() => setBasicModalOpen(false)}
        title="기본 Modal"
        description="다양한 크기와 옵션을 지원하는 기본 Modal입니다."
        size="md"
      >
        <div className="space-y-4">
          <p>이것은 기본 Modal 컴포넌트입니다. 다음과 같은 특징이 있습니다:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>완전한 접근성 지원 (포커스 트랩, ARIA 라벨)</li>
            <li>부드러운 애니메이션 효과</li>
            <li>ESC 키 및 오버레이 클릭으로 닫기</li>
            <li>다양한 크기 지원 (sm, md, lg, xl, full)</li>
            <li>모바일 반응형 지원</li>
          </ul>
          <div className="flex gap-2 pt-4">
            <Button size="sm" variant="primary">
              주요 액션
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setBasicModalOpen(false)}
            >
              닫기
            </Button>
          </div>
        </div>
      </Modal>

      {/* 확인/취소 Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="확인이 필요합니다"
        description="이 작업을 계속 진행하시겠습니까?"
        confirmLabel="진행"
        cancelLabel="취소"
        onConfirm={async () => {
          // 비동기 작업 시뮬레이션
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log("작업 완료!");
        }}
        onCancel={() => {
          console.log("작업 취소됨");
        }}
      >
        <p className="text-gray-600">
          이 작업은 되돌릴 수 없습니다. 정말로 진행하시겠습니까?
        </p>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        itemName="예측 게임"
        onConfirm={async () => {
          console.log("삭제 완료!");
        }}
      >
        {/* children prop이 필요하므로 빈 div 추가 */}
        <div />
      </DeleteConfirmDialog>

      {/* 경고 Dialog */}
      <AlertDialog
        isOpen={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        type="warning"
        title="주의 필요"
        confirmLabel="이해했습니다"
      >
        <div className="space-y-2">
          <p className="text-gray-600">
            이 기능은 베타 버전입니다. 예상치 못한 문제가 발생할 수 있습니다.
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside">
            <li>데이터 손실 가능성</li>
            <li>일시적인 서비스 중단</li>
            <li>성능 저하</li>
          </ul>
        </div>
      </AlertDialog>

      {/* 모바일 Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="모바일 친화적 Drawer"
        description="하단에서 올라오는 애니메이션"
        height="half"
        snapToTop={true}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            이것은 모바일에 최적화된 Drawer 컴포넌트입니다.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium">특징:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 터치 드래그로 닫기</li>
              <li>• 스냅 투 탑 (전체 화면 확장)</li>
              <li>• 다양한 높이 옵션</li>
              <li>• 부드러운 스프링 애니메이션</li>
            </ul>
          </div>
          <div className="pt-4">
            <Button
              size="sm"
              onClick={() => setDrawerOpen(false)}
              className="w-full"
            >
              닫기
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Action Sheet */}
      <ActionSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title="액션 선택"
        actions={[
          {
            label: "편집",
            onClick: () => console.log("편집 선택"),
            icon: <Edit size={16} />,
          },
          {
            label: "공유",
            onClick: () => console.log("공유 선택"),
            icon: <Share size={16} />,
          },
          {
            label: "다운로드",
            onClick: () => console.log("다운로드 선택"),
            icon: <Download size={16} />,
          },
          {
            label: "설정",
            onClick: () => console.log("설정 선택"),
            icon: <Settings size={16} />,
          },
          {
            label: "삭제",
            onClick: () => console.log("삭제 선택"),
            icon: <Trash2 size={16} />,
            destructive: true,
          },
        ]}
      />

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="상세 정보"
        height="half"
        scrollable={true}
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">상품 정보</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>이름: Premium Modal System</p>
              <p>버전: 1.0.0</p>
              <p>라이선스: MIT</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">상세 설명</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              완전한 접근성을 지원하는 모던한 Modal 시스템입니다. Radix UI와
              Framer Motion을 기반으로 구축되어 최고의 사용자 경험을 제공합니다.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">기능 목록</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 포커스 트랩 및 키보드 네비게이션</li>
              <li>• 스크린 리더 완전 지원</li>
              <li>• 부드러운 애니메이션 효과</li>
              <li>• 모바일 친화적 터치 제스처</li>
              <li>• TypeScript 완전 지원</li>
              <li>• 다크 모드 지원</li>
            </ul>
          </div>
        </div>
      </BottomSheet>

      {/* 훅 사용 Drawer */}
      <Drawer
        isOpen={mobileDrawer.isOpen}
        onClose={mobileDrawer.close}
        title="useDrawer 훅 사용 예제"
        height="auto"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            useDrawer 훅을 사용하여 상태를 관리하는 예제입니다.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={mobileDrawer.toggle}>
              토글
            </Button>
            <Button size="sm" variant="ghost" onClick={mobileDrawer.close}>
              닫기
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default ModalExamples;
