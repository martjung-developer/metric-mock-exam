// components/dashboard/admin/notifications/NotificationForm.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Pure UI component – the "Send Notification" slide-down panel.
// Owns only local form state (controlled inputs).
// Calls onSubmit / onCancel callbacks – no Supabase, no hooks beyond useState.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import {
  Send, X, ChevronDown, User, Users, Bell, AlertTriangle, Loader2,
} from "lucide-react";
import type {
  NotifType,
  TargetMode,
  StudentWithProfile,
  SendNotificationPayload,
  NotificationFormState,
} from "@/lib/types/admin/notifications/notifications.types";
import { NOTIFICATION_FORM_DEFAULTS } from "@/lib/types/admin/notifications/notifications.types";
import styles from "@/app/(dashboard)/admin/notifications/notifications.module.css";

const TYPE_OPTIONS: NotifType[] = ["exam", "result", "general"];

// ─────────────────────────────────────────────────────────────────────────────

interface NotificationFormProps {
  students: StudentWithProfile[];
  sending: boolean;
  fetchError: string;
  onSubmit: (payload: SendNotificationPayload) => Promise<string | null>;
  onCancel: () => void;
}

export function NotificationForm({
  students,
  sending,
  fetchError,
  onSubmit,
  onCancel,
}: NotificationFormProps) {
  const [form, setForm] = useState<NotificationFormState>(NOTIFICATION_FORM_DEFAULTS);
  const [formError, setFormError] = useState<string>("");

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function patch<K extends keyof NotificationFormState>(
    key: K,
    value: NotificationFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMultiId(id: string) {
    setForm((prev) => ({
      ...prev,
      multiIds: prev.multiIds.includes(id)
        ? prev.multiIds.filter((x) => x !== id)
        : [...prev.multiIds, id],
    }));
  }

  function reset() {
    setForm(NOTIFICATION_FORM_DEFAULTS);
    setFormError("");
    onCancel();
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSend() {
    setFormError("");

    if (!form.title.trim() || !form.message.trim()) {
      setFormError("Title and message are required.");
      return;
    }

    let recipientIds: string[] = [];

    if (form.targetMode === "all") {
      recipientIds = students.map((s) => s.id);
      if (!recipientIds.length) {
        setFormError("No enrolled students found to notify.");
        return;
      }
    } else if (form.targetMode === "single") {
      if (!form.singleId) { setFormError("Please select a student."); return; }
      recipientIds = [form.singleId];
    } else {
      if (!form.multiIds.length) { setFormError("Select at least one student."); return; }
      recipientIds = form.multiIds;
    }

    const error = await onSubmit({
      title: form.title,
      message: form.message,
      type: form.type,
      recipientIds,
    });

    if (error) {
      setFormError(error);
    } else {
      setForm(NOTIFICATION_FORM_DEFAULTS);
      setFormError("");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.formPanel}>
      {/* Header */}
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>
          <span className={styles.formTitleIcon}><Send size={13} color="#fff" /></span>
          Send Notification
        </span>
        <button className={styles.btnIconClose} onClick={reset} title="Close">
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className={styles.formBody}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Title</label>
          <input
            className={styles.formInput}
            value={form.title}
            onChange={(e) => patch("title", e.target.value)}
            placeholder="e.g. Upcoming Board Exam Reminder"
          />
        </div>

        {/* Type */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Type</label>
          <div className={styles.selectWrap}>
            <select
              className={styles.formSelect}
              value={form.type}
              onChange={(e) => patch("type", e.target.value as NotifType)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className={styles.selectChevron} />
          </div>
        </div>

        {/* Message */}
        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Message</label>
          <textarea
            className={styles.formTextarea}
            value={form.message}
            onChange={(e) => patch("message", e.target.value)}
            placeholder="Write your notification message here…"
            rows={3}
          />
        </div>

        {/* Recipients */}
        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Recipients</label>
          <TargetModePicker
            value={form.targetMode}
            studentCount={students.length}
            onChange={(mode: TargetMode) => patch("targetMode", mode)}
          />
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div className={styles.formGroupFull}>
            <p className={styles.formError}>
              <AlertTriangle size={12} /> {fetchError}
            </p>
          </div>
        )}

        {/* Single picker */}
        {form.targetMode === "single" && (
          <SingleStudentPicker
            students={students}
            value={form.singleId}
            onChange={(id: string) => patch("singleId", id)}
          />
        )}

        {/* Multiple picker */}
        {form.targetMode === "multiple" && (
          <MultiStudentPicker
            students={students}
            selected={form.multiIds}
            onToggle={toggleMultiId}
          />
        )}

        {/* Broadcast warning */}
        {form.targetMode === "all" && (
          <div className={styles.formGroupFull}>
            <div className={styles.broadcastAlert}>
              <AlertTriangle size={15} className={styles.broadcastAlertIcon} />
              This will send a notification to all{" "}
              <strong>&nbsp;{students.length}&nbsp;</strong> enrolled students.
            </div>
          </div>
        )}

        {/* Form error */}
        {formError && (
          <div className={styles.formGroupFull}>
            <p className={styles.formError}>
              <AlertTriangle size={12} /> {formError}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.formFooter}>
        <button className={styles.btnSecondary} onClick={reset}>
          <X size={13} /> Cancel
        </button>
        <button className={styles.btnPrimary} onClick={handleSend} disabled={sending}>
          {sending
            ? <Loader2 size={14} className={styles.spinner} />
            : <Send size={14} />}
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (co-located, not exported – only used inside NotificationForm)
// ─────────────────────────────────────────────────────────────────────────────

interface TargetModePickerProps {
  value: TargetMode;
  studentCount: number;
  onChange: (mode: TargetMode) => void;
}

function TargetModePicker({ value, studentCount, onChange }: TargetModePickerProps) {
  const modes: TargetMode[] = ["single", "multiple", "all"];
  return (
    <div className={styles.targetModes}>
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`${styles.targetMode} ${value === mode ? styles.targetModeActive : ""}`}
        >
          {mode === "single"   && <User   size={12} />}
          {mode === "multiple" && <Users  size={12} />}
          {mode === "all"      && <Bell   size={12} />}
          {mode === "single"
            ? "Single Student"
            : mode === "multiple"
            ? "Multiple Students"
            : `All Students (${studentCount})`}
        </button>
      ))}
    </div>
  );
}

interface SingleStudentPickerProps {
  students: StudentWithProfile[];
  value: string;
  onChange: (id: string) => void;
}

function SingleStudentPicker({ students, value, onChange }: SingleStudentPickerProps) {
  return (
    <div className={styles.formGroupFull}>
      <label className={styles.formLabel}>Select Student</label>
      <div className={styles.selectWrap}>
        <select
          className={styles.formSelect}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Choose a student —</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name ?? s.email}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className={styles.selectChevron} />
      </div>
      {students.length === 0 && (
        <p className={styles.noStudents}>
          No enrolled students found. Ensure the student account has
          role=&apos;student&apos; in the profiles table.
        </p>
      )}
    </div>
  );
}

interface MultiStudentPickerProps {
  students: StudentWithProfile[];
  selected: string[];
  onToggle: (id: string) => void;
}

function MultiStudentPicker({ students, selected, onToggle }: MultiStudentPickerProps) {
  return (
    <div className={styles.formGroupFull}>
      <label className={styles.formLabel}>
        Select Students{selected.length > 0 ? ` (${selected.length} selected)` : ""}
      </label>
      <div className={styles.studentList}>
        {students.length === 0 ? (
          <p className={styles.noStudents}>
            No enrolled students found. Ensure the student account has
            role=&apos;student&apos; in the profiles table.
          </p>
        ) : (
          students.map((s) => (
            <label key={s.id} className={styles.studentRow}>
              <input
                type="checkbox"
                className={styles.studentCheckbox}
                checked={selected.includes(s.id)}
                onChange={() => onToggle(s.id)}
              />
              <span className={styles.studentName}>{s.full_name ?? "—"}</span>
              <span className={styles.studentEmail}>{s.email}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}