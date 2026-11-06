"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, AlertCircle, Building2, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWishlistRequests, approveWishlistRequest } from "../wishlist.actions";

interface WishlistAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

export function WishlistAdminModal({
  isOpen,
  onClose,
  onApproved,
}: WishlistAdminModalProps) {
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const list = await getWishlistRequests("pending");
    setPendingList(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchPending();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (id: string, facilityName: string) => {
    setProcessingId(id);
    const res = await approveWishlistRequest(id, "고유번호증 및 복지시설 인가 서류 100% 검증 승인");
    setProcessingId(null);

    if (res.success) {
      alert(`[${facilityName}]의 물품 지원 신청이 승인되었습니다!\n물품 상세페이지 실시간 펀딩 목록에 즉시 등록되었습니다.`);
      fetchPending();
      if (onApproved) onApproved();
    } else {
      alert("승인 처리 중 오류: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-3xl w-full rounded-3xl bg-slate-900 border border-purple-500/40 p-6 sm:p-8 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar space-y-6"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            PosMul 공익심사위 · 관리자 검증 게이트 (Verification Gate)
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            복지시설 K-위시리스트 심사 및 승인
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            전국 복지시설에서 접수된 물품 신청서를 검토하고, 인가 서류가 확인되면 시민 펀딩을 개설합니다.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            심사 대기 목록을 불러오는 중...
          </div>
        ) : pendingList.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
            <p className="text-sm font-bold text-slate-300">
              현재 심사 대기 중인 신청이 없습니다.
            </p>
            <p className="text-xs text-slate-500">
              모든 신청서가 검증 완료되어 시민 크라우드펀딩에 등록되었습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>대기 중인 신청: <strong>{pendingList.length}건</strong></span>
              <span className="text-amber-300">승인 시 실시간 펀딩 자동 개설</span>
            </div>

            {pendingList.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base">
                        {req.facility_name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300">
                        {req.facility_type}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                        {req.region_city} {req.region_district}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-3">
                      <span>담당: <strong>{req.contact_person}</strong> ({req.contact_phone})</span>
                      <span>고유번호증: <strong className="text-slate-300">{req.business_license_number || "미기재"}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApprove(req.id, req.facility_name)}
                    disabled={processingId === req.id}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{processingId === req.id ? "처리 중..." : "✓ 서류 확인 및 펀딩 승인"}</span>
                  </button>
                </div>

                {/* Requested Item Badge */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.04] text-xs flex items-center justify-between">
                  <span className="text-slate-400">
                    신청 물품: <strong className="text-slate-200">{req.project?.product_name || "지정 물품"}</strong> ({req.project?.manufacturer})
                  </span>
                  <span className="text-purple-300 font-bold">
                    신청 수량: {req.needed_quantity}개
                  </span>
                </div>

                {/* Story */}
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <p className="text-slate-500 font-medium mb-1">현장 사연:</p>
                  "{req.story}"
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
