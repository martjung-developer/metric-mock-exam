# Table of Specifications Design (Draft)

## Scope

Applies to exams for BLIS and SSLATE programs: BSPsych, BEEd, BSEd-MATH, BSEd-SCI, BSEd-ENG, and BSEd-FIL. SARFAID is out of scope. TOS weights are entered by an administrator per exam; this design does not prescribe PRC, DepEd, or CHED percentages.

## Current scoring behavior

The current grading path is point-based:

- `gradeAnswer` auto-grades multiple choice, true/false, and fill-in-the-blank using trimmed, case-insensitive exact string equality. A correct answer earns the question's full points; an incorrect or missing answer earns zero.
- Essay, short answer, and matching are treated as manual types by `gradeAnswer`; they start with zero points and `is_correct: null`. Graders can assign points manually.
- Submission score is the sum of `points_earned` across its answers. Null earned-points values count as zero.
- Percentage is `earned / exams.total_points * 100`, rounded to two decimal places. If `total_points` is not positive, percentage is zero.
- `passed` is `percentage >= exams.passing_score`.
- Single and bulk grading use these same score inputs. `duration_minutes` controls exam timing; elapsed time is stored as `time_spent_seconds` and is not part of the score.
- Results services read the persisted score, percentage, and passed fields. They do not recalculate them.

Relevant current files:

- `lib/utils/admin/submissions/grading.ts` — `gradeAnswer`, `sumPoints`, and `computeScore`.
- `lib/hooks/admin/exams/submissions/useGrading.ts` — single-submission grading and score preview.
- `lib/hooks/admin/exams/submissions/useBulkGrading.ts` — bulk grading and result release.
- `lib/services/admin/exams/submissions/submission.service.ts` — answer/submission persistence and exam answer-key reads.
- `lib/services/admin/exams/submissions/exam.service.ts` — grading metadata, including `total_points` and `passing_score`.
- `lib/services/admin/exams/answer-key/answerKey.service.ts` — answer-key question fetch/save.
- `lib/services/admin/exams/results/results.service.ts` — reads persisted results and analytics.
- `lib/types/admin/exams/exam.types.ts` — admin exam domain types.
- `lib/types/admin/exams/submissions/exam.types.ts` — grading metadata and preview score types.
- `lib/types/admin/exams/submissions/answer.types.ts` — answer/question grading types.
- `lib/types/admin/exams/submissions/submission.types.ts` — submission score fields and grading mode.

## Proposed data model

Add `public.exam_tos_areas` with:

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` primary key | Area row identifier |
| `exam_id` | `uuid` foreign key to `public.exams(id)` with cascade delete | Owning exam |
| `area_title` | `text` not null | Human-readable subject/topic area |
| `weight_percent` | `numeric(5,2)` not null | Admin-entered contribution to the overall percentage |
| `expected_items` | `integer` not null | Planned number of question items for this area |
| `min_percent` | `numeric(5,2)` not null | Minimum area percentage required for the TOS pass condition |
| `created_at`, `updated_at` | `timestamptz` | Audit timestamps |

Require `weight_percent` and `min_percent` within 0–100, `expected_items >= 0`, and unique `(exam_id, area_title)`. Validate that all area weights sum to 100 when an administrator saves or publishes a TOS; a normal row-level SQL constraint cannot enforce a sum across rows. `expected_items` is planning/configuration data and does not change an area's score denominator: actual question points do that.

Enable RLS. Policies should mirror the existing `exams` table authorization by checking access to the parent exam through `EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_tos_areas.exam_id)`. For writes, require the same parent-exam write authorization used by exams. The checked-in schema snapshot does not contain the live `exams` RLS policy definitions, so the SQL draft uses parent-row RLS as the authorization boundary and should be reconciled against the deployed policy names/roles before application.

## Topic mapping and scoring

Use `questions.section_title` and `questions.section_number` as the topic key; do not add question columns. Prefer normalized `section_title` matching (trimmed, case-insensitive, collapsed whitespace) to `exam_tos_areas.area_title`. When a title is absent, allow a stable section-number-derived area label only if the exam's TOS area is explicitly configured with that label. Do not infer official subject weights or area names.

For a valid TOS-enabled exam:

1. Each question must map to exactly one configured area. A TOS area with no questions, an unmapped question, duplicate normalized area titles, invalid/non-100 total weights, or invalid expected-item setup makes the TOS configuration invalid. Do not silently omit or redistribute weight.
2. For each area, compute `area_percent = area_points_earned / area_points_possible * 100`, where possible points are the sum of the actual question points in that area. A non-positive possible-points total makes the configuration invalid.
3. Compute the final percentage as `sum(area_percent * weight_percent / 100)` and round to two decimal places, consistently with `computeScore`.
4. `passed` is true only when the weighted final percentage meets `exams.passing_score` and every area's percentage meets that area's `min_percent`.
5. `score` remains the existing raw sum of points earned, preserving the existing field's meaning; `percentage` stores the weighted TOS percentage. Continue writing the normal submission fields so existing result consumers remain compatible.
6. `duration_minutes` remains solely the timer input. It is never a scoring weight or denominator.

If no TOS rows exist for an exam, use the existing point-based calculation exactly: raw earned points, `earned / total_points`, and `passing_score`. Invalid configured TOS must be surfaced to the grader/admin and must not silently fall back after the exam has been explicitly configured; this distinction should be enforced in Phase 2 so a malformed TOS cannot produce misleading results.

Manual question types keep their current grading lifecycle. Their currently assigned `points_earned` contribute to area totals; ungraded manual answers therefore contribute zero until graded, as they do today.

## Phase 2 file proposal (not approved or modified)

Expected changes, subject to inspection and approval:

- `lib/types/database.ts` — add generated-style table typing for `exam_tos_areas`.
- `lib/types/admin/exams/exam.types.ts` and `lib/types/admin/exams/submissions/exam.types.ts` — add TOS domain/input and score-breakdown types.
- `lib/services/admin/exams/exam.service.ts` — add scoped TOS fetch/save operations.
- `lib/services/admin/exams/submissions/exam.service.ts` — load TOS configuration alongside grading metadata.
- `lib/utils/admin/submissions/grading.ts` — pure topic grouping, configuration validation, area percentages, and weighted score calculation while preserving the no-TOS branch exactly.
- `lib/hooks/admin/exams/submissions/useGrading.ts` and `lib/hooks/admin/exams/submissions/useBulkGrading.ts` — pass question section metadata and TOS configuration through both grading paths.
- `lib/services/admin/exams/submissions/submission.service.ts` — include section metadata where grading answer/question data is fetched, if that is the existing query boundary.
- Existing exam create/detail or answer-key UI files — provide per-exam TOS area configuration and display/edit area topics, after confirming the narrowest established admin workflow.
- `app/(dashboard)/admin/exams/[examId]/submissions/page.tsx` and its faculty counterpart, only if needed to surface TOS validation or area breakdown without changing unrelated workflows.
- Relevant TOS UI CSS module(s), if required.

No Phase 2 changes are made by this draft. No migration is applied.
