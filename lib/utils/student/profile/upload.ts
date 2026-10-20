/**
 * lib/utils/student/profile/upload.ts
 *
 * Re-exports from the unified shared upload utility.
 * Kept so existing imports in student code don't break.
 */

export {
  validateAvatarFile,
  uploadAvatarFromDataUrl as uploadAvatar,
  deleteAvatar,
} from '@/lib/utils/shared/avatar/upload'

export type {
  FileValidation,
  UploadAvatarResult,
  DeleteAvatarResult,
} from '@/lib/utils/shared/avatar/upload'