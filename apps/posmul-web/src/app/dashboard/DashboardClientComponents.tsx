/**
 * 대시보드 클라이언트 컴포넌트
 *
 * 서버 컴포넌트에서 사용할 클라이언트 래퍼들입니다.
 */
"use client";

import React from "react";

import { FlowDiagram } from "../../shared/ui/components/FlowDiagram";

/** 자산 흐름 데이터 타입 */
interface FlowData {
    pmpEarned: number;
    pmpUsed: number;
    pmcEarned: number;
    pmcDonated: number;
    pmpBalance: number;
    pmcBalance: number;
    activeBets: number;
    lockedPmp: number;
}

/** FlowDiagramSection Props */
interface FlowDiagramSectionProps {
    data: FlowData;
}

/**
 * 자산 흐름 다이어그램 섹션
 */
export function FlowDiagramSection({ data }: FlowDiagramSectionProps) {
    return <FlowDiagram data={data} />;
}

/**
 * 간략 자산 흐름 다이어그램
 */
export function CompactFlowDiagramSection({ data }: FlowDiagramSectionProps) {
    return <FlowDiagram data={data} compact />;
}

export default {
    FlowDiagramSection,
    CompactFlowDiagramSection,
};
