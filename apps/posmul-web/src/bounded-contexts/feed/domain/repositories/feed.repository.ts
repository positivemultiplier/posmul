import { Result } from "@posmul/auth-economy-sdk";
import { RssSource } from "../entities/rss-source.entity";
import { FeedItem } from "../entities/feed-item.entity";
import { Bill } from "../entities/bill.entity";
import { ProcessStatus } from "../value-objects/feed-types";

export interface IRssSourceRepository {
    findAllActive(): Promise<Result<RssSource[]>>;
    save(source: RssSource): Promise<Result<void>>;
    findByUrl(url: string): Promise<Result<RssSource | null>>;
}

export interface IFeedItemRepository {
    save(item: FeedItem): Promise<Result<void>>;
    findByLink(link: string): Promise<Result<FeedItem | null>>;
    findPendingItems(limit: number): Promise<Result<FeedItem[]>>;
    findItemsByStatus(status: ProcessStatus, limit: number): Promise<Result<FeedItem[]>>;
    update(item: FeedItem): Promise<Result<void>>;
}

export interface IBillRepository {
    save(bill: Bill): Promise<Result<void>>;
    findByBillId(billId: string): Promise<Result<Bill | null>>;
    findAllMonitoringBills(): Promise<Result<Bill[]>>; // 모니터링 대상(처리되지 않은) 의안 조회
}
