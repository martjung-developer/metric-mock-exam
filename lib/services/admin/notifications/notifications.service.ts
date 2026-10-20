// lib/services/admin/notifications/notifications.service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type {
  Notification,
  SendNotificationPayload,
  ServiceResult,
  StudentWithProfile,
} from "@/lib/types/admin/notifications/notifications.types";

export {
  fetchNotifications as fetchNotificationsUtil,
  markAsRead as markAsReadUtil,
  markAllAsRead as markAllAsReadUtil,
  deleteNotification as deleteNotificationUtil,
  createNotification as createNotificationUtil,
  createBulkNotifications as createBulkNotificationsUtil,
  NotifTemplates,
} from "@/lib/utils/admin/notifications/notifications";

type NotificationsApiResponse = {
  success: boolean;
  error?: string;
  notifications?: Notification[];
  students?: StudentWithProfile[];
};

function toResult<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

function toError<T = void>(message: string): ServiceResult<T> {
  return { data: null, error: message };
}

async function readApiResponse<T>(
  res: Response,
  pickData: (body: NotificationsApiResponse) => T,
  fallbackError: string,
): Promise<ServiceResult<T>> {
  const body = (await res.json()) as NotificationsApiResponse;
  if (!res.ok || !body.success) {
    return toError(body.error ?? fallbackError);
  }
  return toResult(pickData(body));
}

export async function fetchNotifications(
  supabase: SupabaseClient<Database>,
): Promise<ServiceResult<Notification[]>> {
  void supabase;

  try {
    const res = await fetch("/api/admin/notifications", {
      method: "GET",
      credentials: "same-origin",
    });
    return readApiResponse(res, (body) => body.notifications ?? [], "Could not load notifications.");
  } catch (err) {
    return toError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function fetchNotificationsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ServiceResult<Notification[]>> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return toError(error.message);
    }
    return toResult(data ?? []);
  } catch (err) {
    return toError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function markAsRead(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      return toError(error.message);
    }
    return toResult(undefined);
  } catch (err) {
    return toError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function markAllAsRead(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<ServiceResult> {
  if (!ids.length) {
    return toResult(undefined);
  }

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);

    if (error) {
      return toError(error.message);
    }
    return toResult(undefined);
  } catch (err) {
    return toError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function deleteNotification(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      return toError(error.message);
    }
    return toResult(undefined);
  } catch (err) {
    return toError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function sendNotification(
  supabase: SupabaseClient<Database>,
  payload: SendNotificationPayload,
): Promise<ServiceResult> {
  void supabase;

  const { title, message, type, recipientIds } = payload;

  if (!title.trim() || !message.trim()) {
    return toError("Title and message are required.");
  }
  if (!recipientIds.length) {
    return toError("At least one recipient is required.");
  }

  try {
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        message: message.trim(),
        type,
        recipientIds,
      }),
    });
    return readApiResponse(res, () => undefined, "Could not send notification.");
  } catch (err) {
    return toError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function fetchStudents(
  supabase: SupabaseClient<Database>,
): Promise<ServiceResult<StudentWithProfile[]>> {
  void supabase;

  try {
    const res = await fetch("/api/admin/notifications", {
      method: "GET",
      credentials: "same-origin",
    });
    return readApiResponse(res, (body) => body.students ?? [], "Could not load students.");
  } catch (err) {
    return toError(err instanceof Error ? err.message : "Unknown error");
  }
}
