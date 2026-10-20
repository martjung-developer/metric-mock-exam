// lib/types/admin/students/program.types.ts

// ── Lightweight shape for selects ─────────────────────────────────────────────

export interface Program {
  id:   string
  code: string
  name: string
}

// ── Supabase select row — the minimal projection we fetch ─────────────────────
// Identical to Program here, but kept separate so it can diverge if needed
// (e.g. we later add `full_name` to the query).

export interface ProgramRow {
  id:   string
  code: string
  name: string
}