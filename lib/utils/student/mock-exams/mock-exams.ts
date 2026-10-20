// lib/utils/student/mock-exams/mock-exams.ts

import type { CategoryShape, ProgramShape, QState, AnswerMap, StateMap } from '@/lib/types/student/mock-exams/mock-exams'

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) {return `${m} min`}
  if (m === 0) {return `${h} hr${h > 1 ? 's' : ''}`}
  return `${h} hr${h > 1 ? 's' : ''} ${m} min`
}

export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function resolveQState(qId: string, answers: AnswerMap, states: StateMap): QState {
  return states[qId] ?? (answers[qId] ? 'answered' : 'unanswered')
}

export function unwrapCategory(raw: CategoryShape | CategoryShape[] | null): CategoryShape | null {
  if (!raw) {return null}
  if (Array.isArray(raw)) {return raw[0] ?? null}
  return raw
}

export function unwrapProgram(raw: ProgramShape | ProgramShape[] | null): ProgramShape {
  if (!raw) {return null}
  if (Array.isArray(raw)) {return raw[0] ?? null}
  return raw
}