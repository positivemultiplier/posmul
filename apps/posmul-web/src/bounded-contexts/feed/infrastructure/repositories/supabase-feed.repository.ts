import {
    Result,
    failure,
    success,
} from "@posmul/auth-economy-sdk";
import { UniqueEntityId } from "../../domain/common/entity";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { Bill } from "../../domain/entities/bill.entity";
import { FeedItem } from "../../domain/entities/feed-item.entity";
import { RssSource } from "../../domain/entities/rss-source.entity";
import { IBillRepository, IFeedItemRepository, IRssSourceRepository } from "../../domain/repositories/feed.repository";
import { ContentClassification, ProcessStatus } from "../../domain/value-objects/feed-types";

// Supabase Table Types (generated types와 매핑)
type RssSourceRow = {
    id: string;
    title: string;
    url: string;
    category: string;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
};

type ItemRow = {
    id: string;
    source_id: string | null;
    title: string;
    link: string;
    content_summary: string | null;
    published_at: string | null;
    ai_classification: string | null;
    process_status: string | null;
    processed_at: string | null;
    created_at: string | null;
};

type BillRow = {
    bill_id: string;
    bill_no: string;
    bill_name: string;
    proposer: string | null;
    committee: string | null;
    proc_result: string | null;
    rgs_conf_rslt: string | null;
    last_checked_at: string | null;
    created_at: string | null;
};

export class SupabaseFeedRepository implements IRssSourceRepository, IFeedItemRepository, IBillRepository {
    // --- RSS Source ---
    async findAllActive(): Promise<Result<RssSource[]>> {
        const { data: correctData, error: correctError } = await supabaseAdmin
            .schema("feed")
            .from("rss_sources")
            .select("*")
            .eq("is_active", true);

        if (correctError) {
            return failure(new Error(correctError.message));
        }

        const sources = ((correctData || []) as unknown as RssSourceRow[]).map(r => this.mapToRssSource(r));
        return success(sources);
    }

    async saveSource(source: RssSource): Promise<Result<void>> {
        const row = {
            id: source.id.toString(),
            title: source.title,
            url: source.url,
            category: source.category,
            is_active: source.isActive,
            updated_at: source.updatedAt.toISOString(),
            created_at: source.createdAt.toISOString(),
        };

        const { error } = await supabaseAdmin
            .schema("feed")
            .from("rss_sources")
            .upsert(row);

        if (error) return failure(new Error(error.message));
        return success(undefined);
    }

    async save(entity: RssSource | FeedItem | Bill): Promise<Result<void>> {
        if (entity instanceof RssSource) {
            return this.saveSource(entity);
        } else if (entity instanceof FeedItem) {
            return this.saveFeedItem(entity);
        } else if (entity instanceof Bill) {
            return this.saveBill(entity);
        }
        return failure(new Error("Unknown entity type"));
    }

    async findByUrl(url: string): Promise<Result<RssSource | null>> {
        const { data, error } = await supabaseAdmin
            .schema("feed")
            .from("rss_sources")
            .select("*")
            .eq("url", url)
            .single();

        if (error && error.code !== "PGRST116") return failure(new Error(error.message));
        if (!data) return success(null);

        return success(this.mapToRssSource(data as unknown as RssSourceRow));
    }

    // --- Feed Item ---
    private async saveFeedItem(item: FeedItem): Promise<Result<void>> {
        // any cast to bypass strict generated types mismatch for now
        const row: any = {
            id: item.id.toString(),
            source_id: item.sourceId,
            title: item.title,
            link: item.link,
            content_summary: item.contentSummary,
            published_at: item.publishedAt?.toISOString(),
            ai_classification: item.aiClassification,
            process_status: item.processStatus,
            processed_at: item.processedAt?.toISOString(),
            created_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .schema("feed")
            .from("items")
            .upsert(row);

        if (error) return failure(new Error(error.message));
        return success(undefined);
    }

    async findByLink(link: string): Promise<Result<FeedItem | null>> {
        const { data, error } = await supabaseAdmin
            .schema("feed")
            .from("items")
            .select("*")
            .eq("link", link)
            .single();

        if (error && error.code !== "PGRST116") return failure(new Error(error.message));
        if (!data) return success(null);

        return success(this.mapToFeedItem(data as unknown as ItemRow));
    }

    async findPendingItems(limit: number): Promise<Result<FeedItem[]>> {
        const { data, error } = await supabaseAdmin
            .schema("feed")
            .from("items")
            .select("*")
            .eq("process_status", ProcessStatus.PENDING)
            .limit(limit);

        if (error) return failure(new Error(error.message));

        const items = ((data || []) as unknown as ItemRow[]).map(row => this.mapToFeedItem(row));
        return success(items);
    }

    async findItemsByStatus(status: ProcessStatus, limit: number): Promise<Result<FeedItem[]>> {
        const { data, error } = await supabaseAdmin
            .schema("feed")
            .from("items")
            .select("*")
            .eq("process_status", status)
            .limit(limit);

        if (error) return failure(new Error(error.message));

        const items = ((data || []) as unknown as ItemRow[]).map(row => this.mapToFeedItem(row));
        return success(items);
    }

    async update(item: FeedItem): Promise<Result<void>> {
        return this.save(item); // upsert handles update
    }

    // --- Bill ---
    private async saveBill(bill: Bill): Promise<Result<void>> {
        const row = {
            bill_id: bill.billId,
            bill_no: bill.billNo,
            bill_name: bill.billName,
            proposer: (bill as any).props.proposer,
            committee: (bill as any).props.committee,
            proc_result: bill.procResult,
            rgs_conf_rslt: bill.rgsConfRslt,
            last_checked_at: (bill as any).props.lastCheckedAt?.toISOString(),
            created_at: (bill as any).props.createdAt?.toISOString(),
        };

        const { error } = await supabaseAdmin.schema("feed").from("bills").upsert(row);
        if (error) return failure(new Error(error.message));
        return success(undefined);
    }

    async findByBillId(billId: string): Promise<Result<Bill | null>> {
        const { data, error } = await supabaseAdmin
            .schema("feed")
            .from("bills")
            .select("*")
            .eq("bill_id", billId)
            .single();

        if (error && error.code !== "PGRST116") return failure(new Error(error.message));
        if (!data) return success(null);
        return success(this.mapToBill(data as unknown as BillRow));
    }

    async findAllMonitoringBills(): Promise<Result<Bill[]>> {
        const { data, error } = await supabaseAdmin
            .schema("feed")
            .from("bills")
            .select("*")
            .is("rgs_conf_rslt", null);

        if (error) return failure(new Error(error.message));
        return success(((data || []) as unknown as BillRow[]).map(row => this.mapToBill(row)));
    }

    // --- Mappers ---
    private mapToRssSource(row: RssSourceRow): RssSource {
        return RssSource.create(
            {
                title: row.title,
                url: row.url,
                category: row.category,
                isActive: row.is_active ?? false,
                createdAt: row.created_at ? new Date(row.created_at) : undefined,
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
            },
            new UniqueEntityId(row.id)
        );
    }

    private mapToFeedItem(row: ItemRow): FeedItem {
        return FeedItem.create(
            {
                sourceId: row.source_id,
                title: row.title,
                link: row.link,
                contentSummary: row.content_summary,
                publishedAt: row.published_at ? new Date(row.published_at) : null,
                aiClassification: (row.ai_classification as ContentClassification) || ContentClassification.UNCLASSIFIED,
                processStatus: (row.process_status as ProcessStatus) || ProcessStatus.PENDING,
                processedAt: row.processed_at ? new Date(row.processed_at) : null,
                createdAt: row.created_at ? new Date(row.created_at) : undefined,
            },
            new UniqueEntityId(row.id)
        );
    }

    private mapToBill(row: BillRow): Bill {
        return Bill.create({
            billId: row.bill_id,
            billNo: row.bill_no,
            billName: row.bill_name,
            proposer: row.proposer ?? undefined,
            committee: row.committee ?? undefined,
            procResult: row.proc_result ?? undefined,
            rgsConfRslt: row.rgs_conf_rslt ?? undefined,
            lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at) : null,
            createdAt: row.created_at ? new Date(row.created_at) : undefined,
        });
    }
}
