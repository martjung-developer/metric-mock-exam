// services/admin/dashboard/adminDashboard.service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type {
  DashboardStats,
  PendingSubmission,
  ExamNeedingKey,
  RecentActivity,
} from "@/lib/types/admin/dashboard/dashboard";
 
// ── Convenience aliases from the Database generic ────────────────────────────
 
type ExamRow       = Database["public"]["Tables"]["exams"]["Row"];
type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
type QuestionRow   = Database["public"]["Tables"]["questions"]["Row"];
type ProfileRow    = Database["public"]["Tables"]["profiles"]["Row"];
 
// Subset columns actually selected from `practice_exams`
 
// ── Return shape ──────────────────────────────────────────────────────────────
 
export interface DashboardData {
  stats:           DashboardStats;
  pendingSubs:     PendingSubmission[];
  examsNeedingKey: ExamNeedingKey[];
  recentActivity:  RecentActivity[];
}
 
// ── fetchDisplayName ─────────────────────────────────────────────────────────
 
export async function fetchDisplayName(
  supabase: SupabaseClient<Database>,
  userId:   string,
  fallback: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single<Pick<ProfileRow, "full_name">>();
 
  return data?.full_name ?? fallback;
}
 
// ── fetchDashboardData ────────────────────────────────────────────────────────
 
export async function fetchDashboardData(
  supabase: SupabaseClient<Database>,
  userId:   string,
): Promise<DashboardData> {
 
  // ── 1. Exams + practice exam count (parallel) ────────────────────────────
  const [{ data: myExams }, { count: practiceCount }] = await Promise.all([
  supabase
    .from("exams")
    .select("id, title, is_published, total_points, exam_type") 
    .eq("created_by", userId)
    .returns<Pick<ExamRow, "id" | "title" | "is_published" | "total_points" | "exam_type">[]>(),

  supabase
    .from("exams")                                             
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("is_published", true)
    .eq("exam_type", "practice"),                                
]);

const exams = myExams ?? [];
const myExamIds = exams.map((e) => e.id);

// ── FIX: count only mock exams ───────────────────────────────────────────
const publishedCount: number = exams.filter(
  (e) => e.is_published && e.exam_type === "mock"               
).length;
 
  // ── 2. Early-exit when faculty has no exams ──────────────────────────────
  if (myExamIds.length === 0) {
    return {
      stats: {
        assignedStudents:  0,
        publishedExams:    publishedCount,
        practiceExams:     practiceCount ?? 0,
        pendingGrading:    0,
        gradedNotReleased: 0,
        releasedCount:     0,
        passRate:          null,
        avgScore:          null,
        totalSubmissions:  0,
      },
      pendingSubs:     [],
      examsNeedingKey: [],
      recentActivity:  buildActivity(exams, []),
    };
  }
 
  // ── 3. Submissions + questions + student-count (parallel) ────────────────
  const [
    { data: allSubsRaw },
    { data: qRows },
    { count: assignedStudents },
  ] = await Promise.all([
    supabase
      .from("submissions")
      .select("id, student_id, exam_id, status, percentage, passed, submitted_at")
      .in("exam_id", myExamIds)
      .in("status", ["submitted", "graded", "released"])
      .order("submitted_at", { ascending: false })
      .returns<
        Pick<
          SubmissionRow,
          "id" | "student_id" | "exam_id" | "status" | "percentage" | "passed" | "submitted_at"
        >[]
      >(),
 
    supabase
      .from("questions")
      .select("exam_id, correct_answer")
      .in("exam_id", myExamIds)
      .returns<Pick<QuestionRow, "exam_id" | "correct_answer">[]>(),
 
    supabase
      .from("submissions")
      .select("student_id", { count: "exact", head: true })
      .in("exam_id", myExamIds)
      .in("status", ["submitted", "graded", "released"]),
  ]);
 
  const allSubs = allSubsRaw ?? [];
 
  // ── 4. Aggregate submission stats ───────────────────────────────────────
  const totalSubmissions  = allSubs.length;
  const pendingGrading    = allSubs.filter((s) => s.status === "submitted").length;
  const gradedNotReleased = allSubs.filter((s) => s.status === "graded").length;
  const releasedCount     = allSubs.filter((s) => s.status === "released").length;
 
  const releasedSubs = allSubs.filter((s) => s.status === "released");
  const scores       = releasedSubs
    .map((s) => s.percentage)
    .filter((v): v is number => v !== null);
  const passedCount  = releasedSubs.filter((s) => s.passed === true).length;
 
  const passRate: number | null =
    releasedSubs.length > 0
      ? Math.round((passedCount / releasedSubs.length) * 100)
      : null;
 
  const avgScore: number | null =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
 
  // ── 5. Top-5 pending submissions → resolve names ─────────────────────────
  const pending5 = allSubs.filter((s) => s.status === "submitted").slice(0, 5);
 
  let pendingSubs: PendingSubmission[] = [];
 
  if (pending5.length > 0) {
    const studentIds = [
      ...new Set(pending5.map((s) => s.student_id).filter((id): id is string => id !== null)),
    ];
    const pendingExamIds = [
      ...new Set(pending5.map((s) => s.exam_id).filter((id): id is string => id !== null)),
    ];
 
    const [{ data: profiles }, { data: pendingExams }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds)
        .returns<Pick<ProfileRow, "id" | "full_name">[]>(),
 
      supabase
        .from("exams")
        .select("id, title")
        .in("id", pendingExamIds)
        .returns<Pick<ExamRow, "id" | "title">[]>(),
    ]);
 
    const profMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? "Unknown"]),
    );
    const examMap = new Map(
      (pendingExams ?? []).map((e) => [e.id, e.title]),
    );
 
    pendingSubs = pending5.map((r) => ({
      id:           r.id,
      student_name: r.student_id ? (profMap.get(r.student_id) ?? "Unknown") : "Unknown",
      exam_title:   r.exam_id    ? (examMap.get(r.exam_id)    ?? "Unknown Exam") : "Unknown Exam",
      submitted_at: r.submitted_at,
      status:       r.status,
      percentage:   r.percentage !== null ? Math.round(r.percentage) : null,
      passed:       r.passed,
    }));
  }
 
  // ── 6. Exams missing answer keys ─────────────────────────────────────────
  type ExamKeyMap = Record<string, { total: number; withKey: number }>;
  const examQMap: ExamKeyMap = {};
 
  for (const q of (qRows ?? [])) {
    if (!q.exam_id) {continue;}
    if (!examQMap[q.exam_id]) {examQMap[q.exam_id] = { total: 0, withKey: 0 };}
    examQMap[q.exam_id].total++;
    if (q.correct_answer) {examQMap[q.exam_id].withKey++;}
  }
 
  const examsNeedingKey: ExamNeedingKey[] = exams
    .filter((e) => {
      const q = examQMap[e.id];
      return !q || q.withKey < q.total;
    })
    .slice(0, 3)
    .map((e) => ({
      id:             e.id,
      title:          e.title,
      total_points:   e.total_points,
      question_count: examQMap[e.id]?.total ?? 0,
    }));
 
  // ── 7. Recent activity feed ───────────────────────────────────────────────
  const recentActivity = buildActivity(exams, pendingSubs);
 
  return {
    stats: {
      assignedStudents:  assignedStudents ?? 0,
      publishedExams:    publishedCount,
      practiceExams:     practiceCount ?? 0,
      pendingGrading,
      gradedNotReleased,
      releasedCount,
      passRate,
      avgScore,
      totalSubmissions,
    },
    pendingSubs,
    examsNeedingKey,
    recentActivity,
  };
}
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
function buildActivity(
  exams:       Pick<ExamRow, "id" | "title">[], 
  pendingSubs: PendingSubmission[],
): RecentActivity[] {
  const activity: RecentActivity[] = [];
 
  exams.slice(0, 2).forEach((e) => {
    activity.push({
      id:    e.id,
      type:  "published",
      label: e.title,
      sub:   "Exam published",
      time:  null,
    });
  });
 
  pendingSubs.slice(0, 2).forEach((s) => {
    activity.push({
      id:    s.id,
      type:  "assigned",
      label: s.student_name,
      sub:   `Submitted ${s.exam_title}`,
      time:  s.submitted_at,
    });
  });
 
  return activity.slice(0, 5);
}
