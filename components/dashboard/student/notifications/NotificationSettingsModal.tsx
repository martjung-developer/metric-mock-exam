// components/dashboard/student/notifications/NotificationSettingsModal.tsx
// Pure UI — settings panel for alert types + delivery frequency.

import { X } from 'lucide-react'
import type { NotifSettings } from '@/lib/types/student/notifications/notifications.types'
import styles from '@/app/(dashboard)/student/notifications/notifications.module.css'
import type { JSX } from 'react'

interface ToggleItem {
  key:  keyof Omit<NotifSettings, 'frequency'>
  name: string
  desc: string
}

const TOGGLE_ITEMS: ToggleItem[] = [
  { key: 'examAlerts',      name: 'Exam Alerts',      desc: 'New exams and graded results'       },
  { key: 'studyReminders',  name: 'Study Reminders',  desc: 'Daily nudges and streak alerts'     },
  { key: 'progressUpdates', name: 'Progress Updates', desc: 'Score milestones and improvements'  },
  { key: 'streakAlerts',    name: 'Streak Alerts',    desc: 'Keep your study streak alive'       },
  { key: 'systemAlerts',    name: 'System',           desc: 'Account and security notices'       },
]

interface NotificationSettingsModalProps {
  settings:       NotifSettings
  onToggle:       (key: keyof Omit<NotifSettings, 'frequency'>) => void
  onFrequency:    (value: 'realtime' | 'daily')                 => void
  onClose:        () => void
}

export function NotificationSettingsModal({
  settings,
  onToggle,
  onFrequency,
  onClose,
}: NotificationSettingsModalProps): JSX.Element {
  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>Notification Settings</p>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Alert toggles */}
          <div>
            <p className={styles.settingsSectionTitle}>Alert Types</p>
            <div className={styles.settingsList}>
              {TOGGLE_ITEMS.map((item) => (
                <div key={item.key} className={styles.settingRow}>
                  <div>
                    <p className={styles.settingName}>{item.name}</p>
                    <p className={styles.settingDesc}>{item.desc}</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={settings[item.key] as boolean}
                      onChange={() => onToggle(item.key)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <p className={styles.settingsSectionTitle}>Delivery Frequency</p>
            <div className={styles.settingsList}>
              <div className={styles.settingRow}>
                <div>
                  <p className={styles.settingName}>Frequency</p>
                  <p className={styles.settingDesc}>How often to receive notifications</p>
                </div>
                <select
                  className={styles.frequencySelect}
                  value={settings.frequency}
                  onChange={(e) => onFrequency(e.target.value as 'realtime' | 'daily')}
                >
                  <option value="realtime">Real-time</option>
                  <option value="daily">Daily Summary</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}