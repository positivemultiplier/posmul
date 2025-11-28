"use client";

import React, { useEffect, useState } from "react";
import { getDonationAction } from "../actions";
import { DonationStatus } from "../../domain/value-objects/donation-value-objects";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../../../shared/ui/components/base";

interface DonationDetailProps {
    donationId: string;
}

export const DonationDetail: React.FC<DonationDetailProps> = ({ donationId }) => {
    const [donation, setDonation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDonation = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getDonationAction(donationId);
                if (result.success) {
                    setDonation(result.data);
                } else {
                    setError("Donation not found");
                }
            } catch (err) {
                setError("An error occurred while fetching donation details");
            } finally {
                setLoading(false);
            }
        };

        if (donationId) {
            fetchDonation();
        }
    }, [donationId]);

    if (loading) return <div className="text-center py-8">로딩 중...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (!donation) return null;

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>기부 상세 정보</CardTitle>
                    <Badge className={
                        donation.status === DonationStatus.COMPLETED ? "bg-green-100 text-green-800" :
                            donation.status === DonationStatus.PENDING ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
                    }>
                        {donation.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-500">기부 ID</div>
                        <div className="font-mono text-sm">{donation.id}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">기부 일시</div>
                        <div>{new Date(donation.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">기부 유형</div>
                        <div>{donation.donationType}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">카테고리</div>
                        <div>{donation.category}</div>
                    </div>
                </div>

                {/* Amount */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">기부 금액</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {donation.amount.toLocaleString()} PMP
                    </div>
                </div>

                {/* Description */}
                <div>
                    <div className="text-sm text-gray-500 mb-1">설명</div>
                    <div className="p-3 border rounded bg-white min-h-[60px]">
                        {donation.description}
                    </div>
                </div>

                {/* Target Info */}
                {donation.instituteId && (
                    <div>
                        <div className="text-sm text-gray-500 mb-1">기부 기관</div>
                        <div className="font-medium">{donation.instituteId}</div>
                    </div>
                )}
                {donation.opinionLeaderId && (
                    <div>
                        <div className="text-sm text-gray-500 mb-1">후원 오피니언 리더</div>
                        <div className="font-medium">{donation.opinionLeaderId}</div>
                    </div>
                )}
                {donation.beneficiaryInfo && (
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">수혜자 정보</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-500">이름</div>
                                <div>{donation.beneficiaryInfo.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">설명</div>
                                <div>{donation.beneficiaryInfo.description}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className="border-t pt-4 text-sm text-gray-600">
                    <div className="flex gap-4">
                        <span>{donation.metadata?.isAnonymous ? "익명 기부" : "실명 기부"}</span>
                        <span>{donation.metadata?.taxDeductible ? "세액공제 가능" : "세액공제 불가"}</span>
                        <span>{donation.metadata?.receiptRequired ? "영수증 발급 필요" : "영수증 미발급"}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
