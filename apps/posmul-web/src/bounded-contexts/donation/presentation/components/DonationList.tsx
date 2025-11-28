"use client";

import React, { useEffect, useState } from "react";
import { listDonationsAction } from "../actions";
import { DonationSearchRequest } from "../../application/dto/donation.dto";
import { DonationStatus, DonationType } from "../../domain/value-objects/donation-value-objects";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "../../../../shared/ui/components/base";

export const DonationList: React.FC = () => {
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [status, setStatus] = useState<DonationStatus | "">("");
    const [type, setType] = useState<DonationType | "">("");

    const fetchDonations = async () => {
        setLoading(true);
        setError(null);
        try {
            const request: DonationSearchRequest = {
                page,
                limit: 10,
                status: status || undefined,
                type: type || undefined,
            };

            const result = await listDonationsAction(request);

            if (result.success) {
                setDonations(result.data.items);
                setTotalPages(result.data.totalPages);
            } else {
                setError("Failed to fetch donations");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, [page, status, type]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value as DonationStatus | "");
        setPage(1);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setType(e.target.value as DonationType | "");
        setPage(1);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>기부 내역</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <select
                        className="border p-2 rounded"
                        value={status}
                        onChange={handleStatusChange}
                    >
                        <option value="">모든 상태</option>
                        {Object.values(DonationStatus).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <select
                        className="border p-2 rounded"
                        value={type}
                        onChange={handleTypeChange}
                    >
                        <option value="">모든 유형</option>
                        {Object.values(DonationType).map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                {/* List */}
                {loading ? (
                    <div className="text-center py-8">로딩 중...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">{error}</div>
                ) : donations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">기부 내역이 없습니다.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">날짜</th>
                                    <th className="px-6 py-3">유형</th>
                                    <th className="px-6 py-3">카테고리</th>
                                    <th className="px-6 py-3">금액</th>
                                    <th className="px-6 py-3">상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.map((donation) => (
                                    <tr key={donation.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">{donation.donationType}</td>
                                        <td className="px-6 py-4">{donation.category}</td>
                                        <td className="px-6 py-4 font-medium">
                                            {donation.amount.toLocaleString()}원
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={
                                                donation.status === DonationStatus.COMPLETED ? "bg-green-100 text-green-800" :
                                                    donation.status === DonationStatus.PENDING ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-gray-100 text-gray-800"
                                            }>
                                                {donation.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        이전
                    </Button>
                    <span className="flex items-center px-4">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        다음
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
