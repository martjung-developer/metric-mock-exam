// components/dashboard/admin/faculty/FacultyTable.tsx
'use client'

import { useState }                    from 'react'
import { MoreVertical, CheckCircle2, XCircle } from 'lucide-react'
import { ROLE_TYPE_LABELS }            from '@/lib/types/admin/faculty'
import type { FacultyRow, FacultyRoleType } from '@/lib/types/admin/faculty'
import { toggleFacultyStatus }         from '@/lib/services/admin/faculty/facultyService'
import styles                          from '@/components/dashboard/admin/faculty/css/FacultyTable.module.css'

interface FacultyTableProps {
  faculty:   FacultyRow[]
  onRefresh: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}

function RoleBadge({ roleType }: { roleType: FacultyRoleType | null }) {
  if (!roleType) return <span className={styles.badgeNone}>—</span>

  const colorMap: Record<FacultyRoleType, string> = {
    professional: styles.badgeProfessional,
    major:        styles.badgeMajor,
    minor:        styles.badgeMinor,
  }

  return (
    <span className={`${styles.badge} ${colorMap[roleType]}`}>
      {ROLE_TYPE_LABELS[roleType]}
    </span>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
      {isActive
        ? <><CheckCircle2 size={11} /> Active</>
        : <><XCircle size={11} /> Inactive</>
      }
    </span>
  )
}

export default function FacultyTable({ faculty, onRefresh }: FacultyTableProps) {
  const [toggling, setToggling] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  async function handleToggle(row: FacultyRow) {
    setToggling(row.faculty_id)
    setMenuOpen(null)
    await toggleFacultyStatus(row.faculty_id, !row.is_active)
    setToggling(null)
    onRefresh()
  }

  if (faculty.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No faculty members found.</p>
        <p className={styles.emptySubtext}>Click "Add Faculty" to create the first account.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Faculty ID</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Department</th>
            <th className={styles.th}>Program</th>
            <th className={styles.th}>Role Type</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Created</th>
            <th className={`${styles.th} ${styles.thActions}`} aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {faculty.map((row) => (
            <tr key={row.id} className={styles.tr}>
              <td className={`${styles.td} ${styles.tdName}`}>
                <div className={styles.avatar} aria-hidden="true">
                  {row.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <span className={styles.name}>{row.full_name}</span>
              </td>
              <td className={styles.td}>
                <code className={styles.idCode}>{row.faculty_id}</code>
              </td>
              <td className={styles.td}>
                <span className={styles.email}>{row.email}</span>
              </td>
              <td className={styles.td}>
                <span className={styles.dept}>{row.school_code ?? '—'}</span>
              </td>
              <td className={styles.td}>
                <span className={styles.dept}>{row.program_code ?? '—'}</span>
              </td>
              <td className={styles.td}>
                <RoleBadge roleType={row.role_type as FacultyRoleType | null} />
              </td>
              <td className={styles.td}>
                <StatusBadge isActive={row.is_active} />
              </td>
              <td className={styles.td}>
                <span className={styles.date}>{formatDate(row.created_at)}</span>
              </td>
              <td className={`${styles.td} ${styles.tdActions}`}>
                <div className={styles.menuWrap}>
                  <button
                    type="button"
                    className={styles.menuBtn}
                    onClick={() => setMenuOpen(menuOpen === row.id ? null : row.id)}
                    aria-label={`Actions for ${row.full_name}`}
                    disabled={toggling === row.faculty_id}
                  >
                    <MoreVertical size={15} />
                  </button>

                  {menuOpen === row.id && (
                    <div
                      className={styles.dropdown}
                      onMouseLeave={() => setMenuOpen(null)}
                    >
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => handleToggle(row)}
                      >
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}