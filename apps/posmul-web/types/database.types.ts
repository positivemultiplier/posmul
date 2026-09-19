export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in string]: { Args: any; Returns: any }
        }
        Enums: {
            [_ in string]: any
        }
    }
    feed: {
        Tables: {
            bills: {
                Row: {
                    bill_id: string
                    bill_name: string
                    bill_no: string
                    committee: string | null
                    created_at: string | null
                    last_checked_at: string | null
                    proc_result: string | null
                    proposer: string | null
                    rgs_conf_rslt: string | null
                }
                Insert: {
                    bill_id: string
                    bill_name: string
                    bill_no: string
                    committee?: string | null
                    created_at?: string | null
                    last_checked_at?: string | null
                    proc_result?: string | null
                    proposer?: string | null
                    rgs_conf_rslt?: string | null
                }
                Update: {
                    bill_id?: string
                    bill_name?: string
                    bill_no?: string
                    committee?: string | null
                    created_at?: string | null
                    last_checked_at?: string | null
                    proc_result?: string | null
                    proposer?: string | null
                    rgs_conf_rslt?: string | null
                }
            }
            items: {
                Row: {
                    ai_classification: string | null
                    content_summary: string | null
                    created_at: string | null
                    id: string
                    link: string
                    process_status: string | null
                    processed_at: string | null
                    published_at: string | null
                    source_id: string | null
                    title: string
                }
                Insert: {
                    ai_classification?: string | null
                    content_summary?: string | null
                    created_at?: string | null
                    id?: string
                    link: string
                    process_status?: string | null
                    processed_at?: string | null
                    published_at?: string | null
                    source_id?: string | null
                    title: string
                }
                Update: {
                    ai_classification?: string | null
                    content_summary?: string | null
                    created_at?: string | null
                    id?: string
                    link?: string
                    process_status?: string | null
                    processed_at?: string | null
                    published_at?: string | null
                    source_id?: string | null
                    title?: string
                }
            }
            rss_sources: {
                Row: {
                    category: string
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    title: string
                    updated_at: string | null
                    url: string
                }
                Insert: {
                    category: string
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    title: string
                    updated_at?: string | null
                    url: string
                }
                Update: {
                    category?: string
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    title?: string
                    updated_at?: string | null
                    url?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
    }
}
