// types/admin/dashboard/dashboard.ts
export interface DashboardStats {
  assignedStudents:  number;
  publishedExams:    number;
  practiceExams:     number;
  pendingGrading:    number;
  gradedNotReleased: number;
  releasedCount:     number;
  passRate:          number | null;
  avgScore:          number | null;
  totalSubmissions:  number;
}
 
export const INITIAL_STATS: DashboardStats = {
  assignedStudents:  0,
  publishedExams:    0,
  practiceExams:     0,
  pendingGrading:    0,
  gradedNotReleased: 0,
  releasedCount:     0,
  passRate:          null,
  avgScore:          null,
  totalSubmissions:  0,
};
 
// Derived from submissions + profiles + exams rows
export interface PendingSubmission {
  id:           string;
  student_name: string;
  exam_title:   string;
  submitted_at: string | null;
  status:       string;
  percentage:   number | null;
  passed:       boolean | null;
}
 
// Derived from exams + questions rows
export interface ExamNeedingKey {
  id:             string;
  title:          string;
  total_points:   number;
  question_count: number;
}
 
// Activity type literal union 
export type ActivityType = "assigned" | "graded" | "uploaded" | "published";
 
export interface RecentActivity {
  id:    string;
  type:  ActivityType;
  label: string;
  sub:   string;
  time:  string | null;
}