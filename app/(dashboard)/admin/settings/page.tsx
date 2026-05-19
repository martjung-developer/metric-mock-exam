// app/(dashboard)/admin/settings/page.tsx
//
// CLEAN ORCHESTRATOR — this file's only jobs are:
//   1. Call useSettings()
//   2. Render the page shell
//   3. Pass props down to pure components
//
// NO Supabase, NO auth, NO storage, NO password logic, NO toast logic, NO derived math.

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { containerVariants } from '@/animations/admin/settings/settings'
import { useSettings } from '@/lib/hooks/admin/settings/useSettings'

import {
  DangerZoneSection,
  PasswordSection,
  PreferencesSection,
  ProfileHero,
  ProfileSection,
  SettingsHeader,
  SettingsSidebar,
  SettingsSkeleton,
  Toast,
} from '@/components/dashboard/admin/setttings'

import s from './settings.module.css'
import type { JSX } from 'react'

export default function SettingsPage(): JSX.Element {
  const [refreshing, setRefreshing] = useState(false)
  const settings = useSettings()

  async function handleRefresh() {
    if (refreshing) {
      return
    }
    setRefreshing(true)
    try {
      await settings.refreshData()
    } finally {
      setRefreshing(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (settings.authLoading || settings.loading) {
    return <SettingsSkeleton />
  }

  // useSettings redirects on missing profile / bad role, so this is a safety net.
  if (!settings.profile) {
    return (<></>)
  }

  return (
    <motion.div
      className={s.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Page header ── */}
      <SettingsHeader refreshing={refreshing} onRefresh={handleRefresh} />

      {/* ── Toast ── */}
      <AnimatePresence>
        {settings.toast && <Toast toast={settings.toast} />}
      </AnimatePresence>

      {/* ── Two-column layout ── */}
      <div className={s.layout}>

        {/* Sidebar nav */}
        <SettingsSidebar
          activeSection={settings.activeSection}
          onNavigate={settings.setActiveSection}
        />

        {/* Main content column */}
        <div className={s.content}>

          {/* Profile hero (always visible) */}
          <ProfileHero
            profile={settings.profile}
            avatarUrl={settings.avatarUrl}
            initials={settings.initials}
          />

          {/* ── Section panels ── */}
          {settings.activeSection === 'profile' && (
            <ProfileSection
              profile={settings.profile}
              avatarUrl={settings.avatarUrl}
              initials={settings.initials}
              form={settings.profileForm}
              avatarUpload={settings.avatarUpload}
              onFullNameChange={settings.setFullName}
              onCancel={settings.resetProfileForm}
              onSave={settings.handleSaveProfile}
              onConfirmUpload={settings.handleConfirmUpload} 
              onDeleteAvatar={settings.handleDeleteAvatar}
            />
          )}

          {settings.activeSection === 'password' && (
            <PasswordSection
              form={settings.passwordForm}
              onCurrentPwChange={settings.setCurrentPw}
              onNewPwChange={settings.setNewPw}
              onConfirmPwChange={settings.setConfirmPw}
              onToggleShowCurrent={settings.toggleShowCurrent}
              onToggleShowNew={settings.toggleShowNew}
              onToggleShowConfirm={settings.toggleShowConfirm}
              onCancel={settings.resetPasswordForm}
              onSave={settings.handleChangePassword}
            />
          )}

          {settings.activeSection === 'preferences' && (
            <PreferencesSection
              preferences={settings.preferences}
              onToggleDarkMode={settings.toggleDarkMode}
              onToggleNotif={settings.toggleNotif}
              onToggleEmailNotif={settings.toggleEmailNotif}
              onSave={settings.handleSavePreferences}
            />
          )}

          {settings.activeSection === 'danger' && (
            <DangerZoneSection onLogout={settings.handleLogout} />
          )}

        </div>
      </div>
    </motion.div>
  )
}
