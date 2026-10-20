// lib/services/admin/exams/questions/questions.service.ts
//
// Pure Supabase I/O — no React, no state, no UI logic.
// Every method returns a typed ServiceResult.

import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/types/database'
import type {
  Question,
  QuestionInsert,
  QuestionRow,
  QuestionUpdate,
  ServiceResult,
} from '@/lib/types/admin/exams/questions/questions.types'
import { parseQuestionRow } from '@/lib/utils/admin/questions/helpers'

// ── Column selection ───────────────────────────────────────────────────────
// Kept as a constant so it stays in sync if columns are added later.
const QUESTION_COLUMNS = [
  'id',
  'exam_id',
  'question_text',
  'question_type',
  'points',
  'order_number',
  'options',
  'correct_answer',
  'image_url',
  'explanation',
  'created_at',
].join(', ')

const QUESTION_IMAGE_BUCKET = 'exam-questions'
const QUESTION_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const QUESTION_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

// ── Fetch ──────────────────────────────────────────────────────────────────

export async function fetchQuestionsByExamId(
  examId: string,
): Promise<ServiceResult<Question[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('questions')
    .select(QUESTION_COLUMNS)
    .eq('exam_id', examId)
    .order('order_number', { ascending: true, nullsFirst: false })

  if (error) {
    return { data: null, error: error.message }
  }

  // Parse each raw DB row into the strongly-typed Question shape.
  const questions: Question[] = (data as QuestionRow[]).map(parseQuestionRow)

  return { data: questions, error: null }
}

// ── Create ─────────────────────────────────────────────────────────────────

export interface CreateQuestionPayload {
  examId:        string
  question_text: string
  question_type: Question['question_type']
  points:        number
  options:       Question['options']
  correct_answer: string | null
  image_url:     string | null
  explanation:   string | null
  order_number:  number
}

export async function createQuestion(
  payload: CreateQuestionPayload,
): Promise<ServiceResult<Question>> {
  const supabase = createClient()

  const insert: QuestionInsert = {
    exam_id:        payload.examId,
    question_text:  payload.question_text,
    question_type:  payload.question_type,
    points:         payload.points,
    options:        payload.options as Json | null,
    correct_answer: payload.correct_answer,
    image_url:      payload.image_url,
    explanation:    payload.explanation,
    order_number:   payload.order_number,
  }

  const { data, error } = await supabase
    .from('questions')
    .insert(insert)
    .select(QUESTION_COLUMNS)
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Insert returned no data.' }
  }

  return { data: parseQuestionRow(data as QuestionRow), error: null }
}

// ── Update ─────────────────────────────────────────────────────────────────

export interface UpdateQuestionPayload {
  id:            string
  question_text: string
  question_type: Question['question_type']
  points:        number
  options:       Question['options']
  correct_answer: string | null
  image_url:     string | null
  explanation:   string | null
}

export async function updateQuestion(
  payload: UpdateQuestionPayload,
): Promise<ServiceResult<void>> {
  const supabase = createClient()

  const patch: QuestionUpdate = {
    question_text:  payload.question_text,
    question_type:  payload.question_type,
    points:         payload.points,
    options:        payload.options as Json | null,
    correct_answer: payload.correct_answer,
    image_url:      payload.image_url,
    explanation:    payload.explanation,
  }

  const { error } = await supabase
    .from('questions')
    .update(patch)
    .eq('id', payload.id)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

export async function uploadQuestionImage(
  examId: string,
  file:   File,
): Promise<ServiceResult<string>> {
  const supabase = createClient()

  if (!(QUESTION_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { data: null, error: 'Only JPG, PNG, and WebP images are supported.' }
  }

  if (file.size > QUESTION_IMAGE_MAX_BYTES) {
    return { data: null, error: 'Image must be smaller than 5 MB.' }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { data: null, error: 'You must be signed in to upload a question image.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'question-image'
  const path = `${examId}/${Date.now()}-${safeName}.${ext}`

  const { error: storageError } = await supabase
    .storage
    .from(QUESTION_IMAGE_BUCKET)
    .upload(path, file, {
      contentType:  file.type,
      cacheControl: '3600',
      upsert:       false,
    })

  if (storageError) {
    return { data: null, error: storageError.message }
  }

  const { data: urlData } = supabase.storage.from(QUESTION_IMAGE_BUCKET).getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  await supabase
    .from('storage_files')
    .insert({
      file_name:   file.name,
      file_path:   path,
      file_type:   file.type,
      file_size:   file.size,
      uploaded_by: userData.user.id,
      purpose:     'exam_questions',
    })

  return { data: publicUrl, error: null }
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteQuestion(id: string): Promise<ServiceResult<void>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

export async function deleteQuestions(ids: string[], examId: string): Promise<ServiceResult<void>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('questions')
    .delete()
    .in('id', ids)
    .eq('exam_id', examId)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}
