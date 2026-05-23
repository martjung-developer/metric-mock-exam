// components/dashboard/admin/faculty/FacultyTable.tsx
'use client'

import { useState }                    from 'react'
import { Eye, Pencil, Trash2, CheckCircle2, XCircle, X } from 'lucide-react'
import { ROLE_TYPE_LABELS, FACULTY_ASSIGNMENT_ROLE_LABELS }            from '@/lib/types/admin/faculty'
import type { FacultyRow, FacultyRoleType } from '@/lib/types/admin/faculty'
import { toggleFacultyStatus, updateFacultyById, deleteFacultyById }         from '@/lib/services/admin/faculty/facultyService'
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
  if (!roleType) {
    return <span className={styles.badgeNone}>—</span>
  }
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
  const [previewRow, setPreviewRow] = useState<FacultyRow | null>(null)
  const [editRow, setEditRow] = useState<FacultyRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<FacultyRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'full_time' | 'part_time' | 'adjunct' | 'emeritus'>('full_time')

  async function handleToggle(row: FacultyRow) {
    setToggling(row.faculty_id)
    await toggleFacultyStatus(row.faculty_id, !row.is_active)
    setToggling(null)
    onRefresh()
  }

  function mapStoredRoleToAssignment(roleType: FacultyRoleType | null): 'full_time' | 'part_time' | 'adjunct' | 'emeritus' {
    if (roleType === 'professional') { return 'full_time' }
    if (roleType === 'major') { return 'part_time' }
    if (roleType === 'minor') { return 'adjunct' }
    return 'emeritus'
  }

  function mapAssignmentToStoredRole(role: 'full_time' | 'part_time' | 'adjunct' | 'emeritus'): FacultyRoleType | null {
    if (role === 'full_time') { return 'professional' }
    if (role === 'part_time') { return 'major' }
    if (role === 'adjunct') { return 'minor' }
    return null
  }

  function openEdit(row: FacultyRow) {
    setEditRow(row)
    setEditName(row.full_name)
    setEditRole(mapStoredRoleToAssignment(row.role_type))
  }

  async function saveEdit() {
    if (!editRow) { return }
    const roleType = mapAssignmentToStoredRole(editRole)
    await updateFacultyById(editRow.faculty_id, {
      full_name: editName,
      role_type: roleType,
    })
    setEditRow(null)
    onRefresh()
  }

  async function confirmDelete() {
    if (!deleteRow) { return }
    await deleteFacultyById(deleteRow.faculty_id)
    setDeleteRow(null)
    onRefresh()
  }

  if (faculty.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No faculty members found.</p>
        <p className={styles.emptySubtext}>Click &quot;Add Faculty&quot; to create the first account.</p>
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
            <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
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
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.iconAction}
                    onClick={() => setPreviewRow(row)}
                    title="Preview"
                    aria-label={`Preview ${row.full_name}`}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconAction}
                    onClick={() => openEdit(row)}
                    title="Edit"
                    aria-label={`Edit ${row.full_name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconAction} ${styles.iconActionDanger}`}
                    onClick={() => setDeleteRow(row)}
                    title="Delete"
                    aria-label={`Delete ${row.full_name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconAction}
                    onClick={() => void handleToggle(row)}
                    title={row.is_active ? 'Deactivate' : 'Activate'}
                    aria-label={`${row.is_active ? 'Deactivate' : 'Activate'} ${row.full_name}`}
                    disabled={toggling === row.faculty_id}
                  >
                    {row.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewRow && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button className={styles.modalClose} onClick={() => setPreviewRow(null)}><X size={14} /></button>
            <h3 className={styles.modalTitle}>Faculty Preview</h3>
            <p className={styles.modalLine}><strong>Name:</strong> {previewRow.full_name}</p>
            <p className={styles.modalLine}><strong>Email:</strong> {previewRow.email}</p>
            <p className={styles.modalLine}><strong>Department:</strong> {previewRow.school_code ?? '—'}</p>
            <p className={styles.modalLine}><strong>Program:</strong> {previewRow.program_code ?? '—'}</p>
            <p className={styles.modalLine}><strong>Status:</strong> {previewRow.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      )}

      {editRow && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button className={styles.modalClose} onClick={() => setEditRow(null)}><X size={14} /></button>
            <h3 className={styles.modalTitle}>Edit Faculty</h3>
            <label className={styles.modalLabel}>Full Name</label>
            <input className={styles.modalInput} value={editName} onChange={(e) => setEditName(e.target.value)} />
            <label className={styles.modalLabel}>Role Assignment</label>
            <select className={styles.modalInput} value={editRole} onChange={(e) => setEditRole(e.target.value as 'full_time' | 'part_time' | 'adjunct' | 'emeritus')}>
              {Object.entries(FACULTY_ASSIGNMENT_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={() => setEditRow(null)}>Cancel</button>
              <button className={styles.modalBtnPrimary} onClick={() => void saveEdit()}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteRow && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button className={styles.modalClose} onClick={() => setDeleteRow(null)}><X size={14} /></button>
            <h3 className={styles.modalTitle}>Delete Faculty</h3>
            <p className={styles.modalLine}>This will remove <strong>{deleteRow.full_name}</strong> from the faculty list.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={() => setDeleteRow(null)}>Cancel</button>
              <button className={`${styles.modalBtnPrimary} ${styles.modalBtnDanger}`} onClick={() => void confirmDelete()}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
