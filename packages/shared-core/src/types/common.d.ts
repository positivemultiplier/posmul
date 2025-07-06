/**
 * 공통 도메인 타입 정의
 */
export type BaseId = string;
export interface PaginationParams {
    page: number;
    pageSize: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface PointTransaction {
    id: string;
    userId: string;
    amount: number;
    type: "PMC" | "PMP";
    transactionType: "EARN" | "SPEND" | "TRANSFER";
    description: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface BaseGame {
    id: string;
    title: string;
    description: string;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface Timestamps {
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export interface SoftDeletable {
    deletedAt?: Date | null;
}
export interface Auditable extends Timestamps {
    createdBy?: string;
    updatedBy?: string;
}
export type LoadingState = "idle" | "loading" | "success" | "error";
export interface AsyncState<T> {
    data: T | null;
    loading: LoadingState;
    error: string | null;
}
