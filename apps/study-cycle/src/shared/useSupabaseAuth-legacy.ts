// TODO: shared-auth 제거 후 SDK로 마이그레이션 필요
// import { supabaseNative } from "@posmul/shared-auth";
import { useEffect, useState } from "react";

export interface AuthState {
  user: unknown | null;
  loading: boolean;
}

export function useSupabaseAuth(): AuthState {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: SDK로 마이그레이션 후 구현
    // 임시로 비활성화
    setLoading(false);
    
    /*
    // 기존 코드 (shared-auth 의존성)
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabaseNative.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabaseNative.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
    */
  }, []);

  return { user, loading };
}
