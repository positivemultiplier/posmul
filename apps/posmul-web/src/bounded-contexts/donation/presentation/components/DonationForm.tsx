"use client";

import React, { useState } from "react";
import { createDonationAction } from "../actions";
import { CreateDonationRequest } from "../../application/dto/donation.dto";
import {
    DonationCategory,
    DonationFrequency,
    DonationType,
} from "../../domain/value-objects/donation-value-objects";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../../../../shared/ui/components/base";

interface DonationFormProps {
    userId: string;
    userBalance: number;
}

export const DonationForm: React.FC<DonationFormProps> = ({
    userId,
    userBalance,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<CreateDonationRequest>>({
        type: DonationType.DIRECT,
        category: DonationCategory.OTHER,
        frequency: DonationFrequency.ONCE,
        isAnonymous: false,
        taxDeductible: true,
        receiptRequired: true,
        amount: 1000,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Basic validation
            if (!formData.amount || formData.amount < 1000) {
                setError("최소 기부 금액은 1,000원입니다.");
                setLoading(false);
                return;
            }

            if (!formData.description) {
                setError("기부 설명을 입력해주세요.");
                setLoading(false);
                return;
            }

            const request = formData as CreateDonationRequest;
            const result = await createDonationAction(userId, request, userBalance);

            if (result.success) {
                setSuccessMessage("기부가 성공적으로 처리되었습니다.");
                setFormData({
                    type: DonationType.DIRECT,
                    category: DonationCategory.OTHER,
                    frequency: DonationFrequency.ONCE,
                    isAnonymous: false,
                    taxDeductible: true,
                    receiptRequired: true,
                    amount: 1000,
                    description: "",
                });
            } else {
                const error = (result as any).error;
                setError(error instanceof Error ? error.message : "기부 처리에 실패했습니다.");
            }
        } catch (err) {
            setError("알 수 없는 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked :
                name === "amount" ? Number(value) : value,
        }));
    };

    return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>기부하기</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Donation Type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">기부 유형</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            >
                                {Object.values(DonationType).map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium mb-1">카테고리</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            >
                                {Object.values(DonationCategory).map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium mb-1">기부 금액 (PMP)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                min="1000"
                                step="100"
                                className="w-full border p-2 rounded"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                보유 잔액: {userBalance.toLocaleString()} PMP
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-1">기부 설명</label>
                            <textarea
                                name="description"
                                value={formData.description || ""}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                                rows={3}
                                placeholder="기부 목적이나 응원 메시지를 입력해주세요."
                            />
                        </div>

                        {/* Conditional Fields based on Type */}
                        {formData.type === DonationType.DIRECT && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium">수혜자 정보</h4>
                                <div>
                                    <label className="block text-sm font-medium mb-1">수혜자 이름</label>
                                    <input
                                        type="text"
                                        name="beneficiaryName"
                                        value={formData.beneficiaryName || ""}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">수혜자 설명</label>
                                    <input
                                        type="text"
                                        name="beneficiaryDescription"
                                        value={formData.beneficiaryDescription || ""}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>
                        )}

                        {formData.type === DonationType.INSTITUTE && (
                            <div>
                                <label className="block text-sm font-medium mb-1">기관 ID</label>
                                <input
                                    type="text"
                                    name="instituteId"
                                    value={formData.instituteId || ""}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    placeholder="기부할 기관의 ID를 입력하세요"
                                />
                            </div>
                        )}

                        {formData.type === DonationType.OPINION_LEADER && (
                            <div>
                                <label className="block text-sm font-medium mb-1">오피니언 리더 ID</label>
                                <input
                                    type="text"
                                    name="opinionLeaderId"
                                    value={formData.opinionLeaderId || ""}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    placeholder="후원할 오피니언 리더의 ID를 입력하세요"
                                />
                            </div>
                        )}

                        {/* Options */}
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isAnonymous"
                                    checked={formData.isAnonymous}
                                    onChange={handleChange}
                                />
                                <span className="text-sm">익명 기부</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="receiptRequired"
                                    checked={formData.receiptRequired}
                                    onChange={handleChange}
                                />
                                <span className="text-sm">영수증 필요</span>
                            </label>
                        </div>

                        {/* Messages */}
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 bg-green-50 text-green-700 rounded text-sm">
                                {successMessage}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "처리 중..." : "기부하기"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        );
};

export default DonationForm;
