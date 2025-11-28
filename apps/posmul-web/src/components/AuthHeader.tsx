"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";

export function AuthHeader() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setIsLoading(false);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-4">
                <div className="w-20 h-10 bg-white/10 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">대시보드</span>
                </Link>

                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                        {user.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt={user.email || "User"}
                                className="w-full h-full rounded-full"
                            />
                        ) : (
                            <UserIcon className="w-4 h-4 text-white" />
                        )}
                    </div>
                    <span className="hidden md:inline text-sm text-gray-300 max-w-[150px] truncate">
                        {user.email}
                    </span>
                </div>

                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 border border-red-500/30"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">로그아웃</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <Link
                href="/auth/login"
                className="px-4 py-2 text-white hover:text-blue-300 transition-colors"
            >
                로그인
            </Link>
            <Link
                href="/auth/signup"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold"
            >
                회원가입
            </Link>
        </div>
    );
}
