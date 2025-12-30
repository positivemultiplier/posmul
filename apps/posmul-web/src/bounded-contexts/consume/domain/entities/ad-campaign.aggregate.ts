import {
    Result,
    success,
    failure,
} from "@posmul/auth-economy-sdk";
import { AggregateRoot } from "../../../../shared/domain/aggregate-root";

export interface AdCampaignProps {
    title: string;
    description: string;
    advertiserName: string;
    totalBudgetPmp: number;
    remainingBudgetPmp: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
}

// DB 레코드 타입
export interface AdCampaignDbRecord {
    id: string;
    title: string;
    description: string;
    advertiser_name: string;
    total_budget: number;
    used_budget: number;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export class AdCampaign extends AggregateRoot<string> {
    private _title: string;
    private _description: string;
    private _advertiserName: string;
    private _totalBudgetPmp: number;
    private _remainingBudgetPmp: number;
    private _startDate: Date;
    private _endDate: Date;
    private _isActive: boolean;
    private _createdAt: Date;
    private _updatedAt: Date;

    private constructor(
        id: string,
        props: AdCampaignProps,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id);
        this._title = props.title;
        this._description = props.description;
        this._advertiserName = props.advertiserName;
        this._totalBudgetPmp = props.totalBudgetPmp;
        this._remainingBudgetPmp = props.remainingBudgetPmp;
        this._startDate = props.startDate;
        this._endDate = props.endDate;
        this._isActive = props.isActive;
        this._createdAt = createdAt || new Date();
        this._updatedAt = updatedAt || new Date();
    }

    public static create(
        props: AdCampaignProps,
        id?: string
    ): Result<AdCampaign, Error> {
        const campaignId = id || crypto.randomUUID();

        // Validation logic here if needed
        if (props.totalBudgetPmp < 0) {
            return failure(new Error("Budget cannot be negative"));
        }

        return success(
            new AdCampaign(campaignId, props)
        );
    }

    /**
     * DB 레코드로부터 AdCampaign 엔티티 생성
     */
    public static fromDatabase(row: Record<string, unknown>): AdCampaign {
        const totalBudget = Number(row.total_budget) || 0;
        const usedBudget = Number(row.used_budget) || 0;

        const props: AdCampaignProps = {
            title: String(row.title || ""),
            description: String(row.description || ""),
            advertiserName: String(row.advertiser_name || ""),
            totalBudgetPmp: totalBudget,
            remainingBudgetPmp: totalBudget - usedBudget,
            startDate: row.start_date ? new Date(String(row.start_date)) : new Date(),
            endDate: row.end_date ? new Date(String(row.end_date)) : new Date(),
            isActive: String(row.status) === "ACTIVE",
        };

        return new AdCampaign(
            String(row.id),
            props,
            row.created_at ? new Date(String(row.created_at)) : new Date(),
            row.updated_at ? new Date(String(row.updated_at)) : new Date()
        );
    }

    /**
     * DB 저장용 레코드로 변환
     */
    public toDatabase(): AdCampaignDbRecord {
        return {
            id: this.id.toString(),
            title: this._title,
            description: this._description,
            advertiser_name: this._advertiserName,
            total_budget: this._totalBudgetPmp,
            used_budget: this._totalBudgetPmp - this._remainingBudgetPmp,
            start_date: this._startDate.toISOString(),
            end_date: this._endDate.toISOString(),
            status: this._isActive ? "ACTIVE" : "INACTIVE",
            created_at: this._createdAt.toISOString(),
            updated_at: this._updatedAt.toISOString(),
        };
    }

    // Getters
    get title(): string { return this._title; }
    get description(): string { return this._description; }
    get isActive(): boolean { return this._isActive; }
    get remainingBudget(): number { return this._remainingBudgetPmp; }
    get advertiserName(): string { return this._advertiserName; }
    get totalBudgetPmp(): number { return this._totalBudgetPmp; }
    get startDate(): Date { return this._startDate; }
    get endDate(): Date { return this._endDate; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    // Logic
    public deductBudget(amount: number): Result<void, Error> {
        if (this._remainingBudgetPmp < amount) {
            return failure(new Error("Insufficient budget"));
        }
        this._remainingBudgetPmp -= amount;
        this._updatedAt = new Date();
        return success(undefined);
    }
}

