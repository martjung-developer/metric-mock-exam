// lib/hooks/admin/students/[examId]/useStudentTabs.ts
import { useState } from 'react'

export type ActiveTab = 'exams' | 'submissions' | 'notifications'

export function useStudentTabs(initial: ActiveTab = 'exams') {
  const [activeTab, setActiveTab] = useState<ActiveTab>(initial)
  return { activeTab, setActiveTab }
}