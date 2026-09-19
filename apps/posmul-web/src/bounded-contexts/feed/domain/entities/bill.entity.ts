import { Entity, UniqueEntityId } from "../common/entity";

interface BillProps {
    billId: string; // API unique ID
    billNo: string; // 의안 번호
    billName: string;
    proposer: string | null;
    committee: string | null;
    procResult: string | null; // 처리결과 (원안가결 등)
    rgsConfRslt: string | null; // 본회의 심의결과
    lastCheckedAt: Date | null;
    createdAt: Date;
}

export class Bill extends Entity<BillProps> {
    get billId(): string {
        return this.props.billId;
    }

    get billNo(): string {
        return this.props.billNo;
    }

    get billName(): string {
        return this.props.billName;
    }

    get procResult(): string | null {
        return this.props.procResult;
    }

    get rgsConfRslt(): string | null {
        return this.props.rgsConfRslt;
    }

    private constructor(props: BillProps, id?: UniqueEntityId) {
        super(props, id);
    }

    public static create(
        props: {
            billId: string;
            billNo: string;
            billName: string;
            proposer?: string | null;
            committee?: string | null;
            procResult?: string | null;
            rgsConfRslt?: string | null;
            lastCheckedAt?: Date | null;
            createdAt?: Date;
        },
        id?: UniqueEntityId
    ): Bill {
        return new Bill(
            {
                billId: props.billId,
                billNo: props.billNo,
                billName: props.billName,
                proposer: props.proposer ?? null,
                committee: props.committee ?? null,
                procResult: props.procResult ?? null,
                rgsConfRslt: props.rgsConfRslt ?? null,
                lastCheckedAt: props.lastCheckedAt ?? new Date(),
                createdAt: props.createdAt ?? new Date(),
            },
            id
        );
    }

    public updateStatus(
        procResult: string | null,
        rgsConfRslt: string | null
    ): boolean {
        let changed = false;
        if (this.props.procResult !== procResult) {
            this.props.procResult = procResult;
            changed = true;
        }
        if (this.props.rgsConfRslt !== rgsConfRslt) {
            this.props.rgsConfRslt = rgsConfRslt;
            changed = true;
        }

        this.props.lastCheckedAt = new Date();
        return changed;
    }

    public isPassed(): boolean {
        const passedKeywords = ["가결", "원안가결", "수정가결"];

        // 본회의 결과가 최우선
        if (this.props.rgsConfRslt && passedKeywords.some(k => this.props.rgsConfRslt?.includes(k))) {
            return true;
        }

        // 처리결과 보조 확인
        if (this.props.procResult && passedKeywords.some(k => this.props.procResult?.includes(k))) {
            return true;
        }

        return false;
    }
}
