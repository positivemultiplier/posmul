import { SupabaseNativeClient, supabaseNative } from "@posmul/shared-auth";
import { useEffect, useState } from "react";

export interface AuthState {
  user:
    | Awaited<
        ReturnType<SupabaseNativeClient["auth"]["getUser"]>
      >["data"]["user"]
    | null;
  loading: boolean;
}

export function useSupabaseAuth(): AuthState {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabaseNative.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabaseNative.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
