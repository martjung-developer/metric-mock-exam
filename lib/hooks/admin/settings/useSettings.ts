// lib/hooks/admin/settings/useSettings.ts
//
// UPDATED from the previously delivered version:
//  - handleAvatarChange (raw file → upload) is REMOVED from the public API
//  - handleConfirmUpload (cropped data-URL → upload) is ADDED
//    so it matches the new AvatarUploader's onConfirmUpload prop
//  - handleDeleteAvatar is ADDED so the Remove button works
//  - Everything else (realtime, password, prefs, etc.) is unchanged

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter }           from 'next/navigation'
import Swal from 'sweetalert2'
import { useUser }             from '@/lib/context/AuthContext'
import { createClient }        from '@/lib/supabase/client'
import { useRealtimeProfile }  from '@/lib/hooks/shared/useRealtimeProfile'
import { useTheme } from '@/lib/hooks/theme/useTheme'
import {
  uploadAvatarFromDataUrl,
  deleteAvatar as sharedDeleteAvatar,
} from '@/lib/utils/shared/avatar/upload'

import * as SettingsService from '@/lib/services/admin/settings/settings.service'

import type {
  AvatarUploadState,
  NavSection,
  PasswordFormState,
  PasswordStrength,
  PreferencesState,
  Profile,
  ProfileFormState,
  ToastState,
} from '@/lib/types/admin/settings/settings.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function derivePasswordStrength(pw: string): PasswordStrength | null {
  if (!pw) {return null}
  const score = [
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
    pw.length >= 12,
  ].filter(Boolean).length
  if (score <= 2) {return 'weak'}
  if (score <= 3) {return 'fair'}
  return 'strong'
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseSettingsReturn {
  authLoading: boolean
  loading:     boolean

  profile:   Profile | null
  avatarUrl: string | null
  initials:  string

  activeSection:    NavSection
  setActiveSection: (section: NavSection) => void

  toast:        ToastState | null
  dismissToast: () => void

  profileForm:       ProfileFormState
  setFullName:       (name: string) => void
  resetProfileForm:  () => void
  handleSaveProfile: () => Promise<void>

  avatarUpload:        AvatarUploadState
  /** Called by AvatarUploader after crop + preview are confirmed */
  handleConfirmUpload: (dataUrl: string) => Promise<void>
  /** Called by AvatarUploader "Remove" button */
  handleDeleteAvatar:  () => Promise<void>

  passwordForm:         PasswordFormState
  setCurrentPw:         (v: string) => void
  setNewPw:             (v: string) => void
  setConfirmPw:         (v: string) => void
  toggleShowCurrent:    () => void
  toggleShowNew:        () => void
  toggleShowConfirm:    () => void
  resetPasswordForm:    () => void
  handleChangePassword: () => Promise<void>

  preferences:           PreferencesState
  toggleDarkMode:        () => void
  toggleNotif:           () => void
  toggleEmailNotif:      () => void
  handleSavePreferences: () => void

  refreshData: () => Promise<void>
  handleLogout: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSettings(): UseSettingsReturn {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user, profile: authProfile, loading: authLoading } = useUser()
  const { resolved, setMode } = useTheme()

  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  const [activeSection, setActiveSection] = useState<NavSection>('profile')

  const [toast,       setToast]     = useState<ToastState | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((next: ToastState) => {
    if (toastTimerRef.current) {clearTimeout(toastTimerRef.current)}
    setToast(next)
    void Swal.fire({
      toast: true,
      position: 'top-end',
      timer: 2800,
      timerProgressBar: true,
      showConfirmButton: false,
      icon: next.type,
      title: next.message,
      background: '#0f172a',
      color: '#e2e8f0',
    })
    toastTimerRef.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {clearTimeout(toastTimerRef.current)}
    setToast(null)
  }, [])

  useEffect(
    () => () => { if (toastTimerRef.current) {clearTimeout(toastTimerRef.current)} },
    [],
  )

  const [fullName,      setFullName]      = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const profileForm: ProfileFormState = useMemo(
    () => ({ fullName, saving: savingProfile }),
    [fullName, savingProfile],
  )

  const resetProfileForm = useCallback(() => {
    setFullName(profile?.full_name ?? '')
  }, [profile])

  const [avatarUpload, setAvatarUpload] = useState<AvatarUploadState>({
    uploading: false,
    progress:  0,
    url:       null,
  })

  const [currentPw,   setCurrentPw]   = useState('')
  const [newPw,       setNewPw_]      = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPw,    setSavingPw]    = useState(false)

  const pwStrength: PasswordStrength | null = useMemo(
    () => derivePasswordStrength(newPw),
    [newPw],
  )

  const setNewPw = useCallback((v: string) => setNewPw_(v), [])

  const passwordForm: PasswordFormState = useMemo(
    () => ({
      currentPw, newPw, confirmPw,
      showCurrent, showNew, showConfirm,
      saving: savingPw, strength: pwStrength,
    }),
    [currentPw, newPw, confirmPw, showCurrent, showNew, showConfirm, savingPw, pwStrength],
  )

  const resetPasswordForm = useCallback(() => {
    setCurrentPw('')
    setNewPw_('')
    setConfirmPw('')
  }, [])

  const toggleShowCurrent = useCallback(() => setShowCurrent((v) => !v), [])
  const toggleShowNew     = useCallback(() => setShowNew((v) => !v), [])
  const toggleShowConfirm = useCallback(() => setShowConfirm((v) => !v), [])

  const [preferences, setPreferences] = useState<PreferencesState>({
    darkMode:     resolved === 'dark',
    notifEnabled: true,
    emailNotif:   true,
  })

  useEffect(() => {
    // Keep the persisted preference in sync with the resolved color scheme.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences((p) => ({ ...p, darkMode: resolved === 'dark' }))
  }, [resolved])

  const toggleDarkMode = useCallback(() => {
    const nextDark = resolved !== 'dark'
    setPreferences((p) => ({ ...p, darkMode: nextDark }))
    setMode(nextDark ? 'dark' : 'light')
  }, [resolved, setMode])
  const toggleNotif      = useCallback(() => setPreferences((p) => ({ ...p, notifEnabled: !p.notifEnabled })), [])
  const toggleEmailNotif = useCallback(() => setPreferences((p) => ({ ...p, emailNotif:   !p.emailNotif })), [])

  const handleSavePreferences = useCallback(() => {
    showToast({ type: 'success', message: 'Preferences saved.' })
  }, [showToast])

  const initials = useMemo(
    () => deriveInitials(profile?.full_name ?? null, profile?.email ?? 'U'),
    [profile],
  )

  // ── Realtime ──────────────────────────────────────────────────────────────
  useRealtimeProfile({
    supabase,
    userId: user?.id ?? null,
    onUpdate: useCallback((updated) => {
      if (updated.avatar_url !== undefined) {
        setAvatarUrl(updated.avatar_url)
        setProfile((p) => (p ? { ...p, avatar_url: updated.avatar_url ?? null } : p))
      }
      if (updated.full_name !== undefined) {
        setProfile((p) => (p ? { ...p, full_name: updated.full_name ?? null } : p))
      }
    }, []),
  })

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) {return}
    if (!user) { router.replace('/login'); return }
    const role =
      authProfile?.role ??
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role  as string | undefined)
    if (role !== 'admin' && role !== 'faculty') {router.replace('/unauthorized')}
  }, [user, authProfile?.role, authLoading, router])

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await SettingsService.getProfile(userId)
    if (!error && data) {
      setProfile(data)
      setFullName(data.full_name ?? '')
      setAvatarUrl(data.avatar_url ?? null)
      return true
    }
    return false
  }, [])

  useEffect(() => {
    if (!user) {return}
    let cancelled = false
    // Load profile data when the signed-in user becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    void (async () => {
      const ok = await fetchProfile(user.id)
      if (cancelled) {return}
      if (!ok) {
        showToast({ type: 'error', message: 'Unable to load settings profile.' })
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [fetchProfile, showToast, user])

  const refreshData = useCallback(async () => {
    if (!user?.id) {return}
    setLoading(true)
    const ok = await fetchProfile(user.id)
    setLoading(false)
    if (!ok) {
      showToast({ type: 'error', message: 'Failed to refresh settings data.' })
      return
    }
    showToast({ type: 'success', message: 'Settings data refreshed.' })
  }, [fetchProfile, showToast, user])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSaveProfile = useCallback(async () => {
    if (!profile) {return}
    setSavingProfile(true)
    const { error } = await SettingsService.updateProfileName(profile.id, fullName.trim())
    setSavingProfile(false)
    if (error) {
      showToast({ type: 'error', message: 'Failed to save profile. Please try again.' })
    } else {
      setProfile((p) => (p ? { ...p, full_name: fullName.trim() } : p))
      showToast({ type: 'success', message: 'Profile updated successfully.' })
    }
  }, [profile, fullName, showToast])

  /**
   * Receives the final cropped PNG data-URL from AvatarUploader.
   * Uploads directly to Supabase Storage + saves URL to profiles table.
   */
  const handleConfirmUpload = useCallback(async (dataUrl: string) => {
    if (!profile) {return}

    setAvatarUpload({ uploading: true, progress: 30, url: null })

    const result = await uploadAvatarFromDataUrl(supabase, profile.id, dataUrl)

    if (result.error || !result.publicUrl) {
      setAvatarUpload({ uploading: false, progress: 0, url: null })
      showToast({ type: 'error', message: 'Avatar upload failed. Please try again.' })
      return
    }

    // Optimistic update — realtime will also confirm
    setAvatarUrl(result.publicUrl)
    setProfile((p) => (p ? { ...p, avatar_url: result.publicUrl } : p))
    setAvatarUpload({ uploading: false, progress: 0, url: result.publicUrl })
    showToast({ type: 'success', message: 'Avatar updated successfully.' })
  }, [supabase, profile, showToast])

  const handleDeleteAvatar = useCallback(async () => {
    if (!profile) {return}
    const { error } = await sharedDeleteAvatar(supabase, profile.id)
    if (error) {
      showToast({ type: 'error', message: 'Could not remove avatar.' })
      return
    }
    setAvatarUrl(null)
    setProfile((p) => (p ? { ...p, avatar_url: null } : p))
    setAvatarUpload({ uploading: false, progress: 0, url: null })
    showToast({ type: 'success', message: 'Avatar removed.' })
  }, [supabase, profile, showToast])

  const handleChangePassword = useCallback(async () => {
    if (newPw !== confirmPw) {
      showToast({ type: 'error', message: 'New passwords do not match.' })
      return
    }
    if (newPw.length < 8) {
      showToast({ type: 'error', message: 'Password must be at least 8 characters.' })
      return
    }
    setSavingPw(true)
    const { error: verifyError } = await SettingsService.verifyPassword(
      profile?.email ?? '', currentPw,
    )
    if (verifyError) {
      setSavingPw(false)
      showToast({ type: 'error', message: 'Current password is incorrect.' })
      return
    }
    const { error } = await SettingsService.updatePassword(newPw)
    setSavingPw(false)
    if (error) {
      showToast({ type: 'error', message: 'Failed to change password.' })
    } else {
      resetPasswordForm()
      showToast({ type: 'success', message: 'Password changed successfully.' })
    }
  }, [currentPw, newPw, confirmPw, profile, showToast, resetPasswordForm])

  const handleLogout = useCallback(async () => {
    window.location.href = '/api/auth/signout'
  }, [])

  return {
    authLoading, loading,
    profile, avatarUrl, initials,
    activeSection, setActiveSection,
    toast, dismissToast,
    profileForm, setFullName, resetProfileForm, handleSaveProfile,
    avatarUpload, handleConfirmUpload, handleDeleteAvatar,
    passwordForm, setCurrentPw, setNewPw, setConfirmPw,
    toggleShowCurrent, toggleShowNew, toggleShowConfirm,
    resetPasswordForm, handleChangePassword,
    preferences, toggleDarkMode, toggleNotif, toggleEmailNotif, handleSavePreferences,
    refreshData,
    handleLogout,
  }
}
