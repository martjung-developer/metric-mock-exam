// hooks/admin/dashboard/useAdminDashboard.ts
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDashboardData,
  fetchDisplayName,
} from "@/lib/services/admin/dashboard/adminDashboard.service";
import { INITIAL_STATS } from "@/lib/types/admin/dashboard/dashboard";
import type {
  DashboardStats,
  PendingSubmission,
  ExamNeedingKey,
  RecentActivity,
} from "@/lib/types/admin/dashboard/dashboard";
 
export interface UseAdminDashboardReturn {
  displayName:     string | null;
  stats:           DashboardStats;
  pendingSubs:     PendingSubmission[];
  recentActivity:  RecentActivity[];
  examsNeedingKey: ExamNeedingKey[];
  loading:         boolean;
  /** true once the first paint is done — used to trigger CSS transitions */
  mounted:         boolean;
}
 
export function useAdminDashboard(user: User | null): UseAdminDashboardReturn {
  // Single stable client for the lifetime of this hook instance
  const supabase = useMemo(() => createClient(), []);
 
  const [displayName,    setDisplayName]    = useState<string | null>(null);
  const [stats,          setStats]          = useState<DashboardStats>(INITIAL_STATS);
  const [pendingSubs,    setPendingSubs]    = useState<PendingSubmission[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [examsNeedingKey,setExamsNeedingKey]= useState<ExamNeedingKey[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [mounted,        setMounted]        = useState(false);
 
  // Prevent double-fetch in React Strict Mode
  const hasFetched = useRef(false);
 
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
 
  useEffect(() => {
    if (!user || hasFetched.current) {
      return;
    }
    hasFetched.current = true;
 
    async function load() {
      // user is guaranteed non-null here (checked above)
      const uid      = user.id;
      const fallback = user.email ?? "User";
 
      // Run display-name fetch and dashboard data fetch in parallel
      const [name, data] = await Promise.all([
        fetchDisplayName(supabase, uid, fallback),
        fetchDashboardData(supabase, uid),
      ]);
 
      setDisplayName(name);
      setStats(data.stats);
      setPendingSubs(data.pendingSubs);
      setRecentActivity(data.recentActivity);
      setExamsNeedingKey(data.examsNeedingKey);
      setLoading(false);
    }
 
    load();
  }, [user, supabase]);
 
  return {
    displayName,
    stats,
    pendingSubs,
    recentActivity,
    examsNeedingKey,
    loading,
    mounted,
  };
}
