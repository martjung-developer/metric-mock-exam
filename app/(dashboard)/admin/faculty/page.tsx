// app/(dashboard)/admin/faculty/page.tsx
'use client'

import { useState, useCallback, useMemo } from 'react'
import { UserPlus, RefreshCw, Users, Search, X } from 'lucide-react'
import { useFacultyList }   from '@/lib/hooks/admin/faculty/useFacultyList'
import type { FacultyRoleType } from '@/lib/types/admin/faculty'
import FacultyTable          from '@/components/dashboard/admin/faculty/FacultyTable'
import FacultyStatsBar       from '@/components/dashboard/admin/faculty/FacultyStatsBar'
import AddFacultyModal       from '@/components/dashboard/admin/faculty/AddFacultyModal'
import styles                from './faculty.module.css'

type AnyRecord = Record<string, unknown>

function getStringField(row: AnyRecord, key: string): string | undefined {
  const value = row[key]
  return typeof value === 'string' ? value : undefined
}

function mapRoleTypeToAssignment(role: FacultyRoleType | null): string {
  if (role === 'professional') { return 'Full-time' }
  if (role === 'major') { return 'Part-time' }
  if (role === 'minor') { return 'Adjunct' }
  return 'Emeritus'
}

// Derive unique departments from the faculty list for tab filters
function getDepartments(faculty: AnyRecord[]) {
  const seen = new Set<string>()
  const depts: string[] = []
  for (const f of faculty) {
    const department = getStringField(f, 'department')
    if (department && !seen.has(department)) {
      seen.add(department)
      depts.push(department)
    }
  }
  return depts.sort()
}

export default function FacultyPage() {
  const { faculty, loading, error, refetch } = useFacultyList()

  const [modalOpen,      setModalOpen]      = useState(false)
  const [toast,          setToast]          = useState<string | null>(null)
  const [search,         setSearch]         = useState('')
  const [activeDept,     setActiveDept]     = useState('All')
  const [roleFilter,     setRoleFilter]     = useState('All')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }, [])

  function handleSuccess(facultyId: string) {
    showToast(`Faculty account created — ID: ${facultyId}`)
    refetch()
  }

  const departments = useMemo(() => getDepartments(faculty), [faculty])

  // Client-side filtering (mirrors students page pattern)
  const filtered = useMemo(() => {
    return faculty.filter((f: AnyRecord) => {
      const department = getStringField(f, 'department')
      const roleTypeRaw = f.role_type
      const roleType = (roleTypeRaw === 'professional' || roleTypeRaw === 'major' || roleTypeRaw === 'minor' || roleTypeRaw === null)
        ? (roleTypeRaw as FacultyRoleType | null)
        : null
      const role = mapRoleTypeToAssignment(roleType)
      const matchesDept = activeDept === 'All' || department === activeDept
      const matchesRole = roleFilter === 'All' || role === roleFilter
      const q = search.toLowerCase()
      const name = getStringField(f, 'name')
      const email = getStringField(f, 'email')
      const facultyId =
        getStringField(f, 'facultyId') ?? getStringField(f, 'faculty_id')
      const matchesSearch =
        !q ||
        name?.toLowerCase().includes(q) ||
        email?.toLowerCase().includes(q) ||
        facultyId?.toLowerCase().includes(q)
      return matchesDept && matchesRole && matchesSearch
    })
  }, [faculty, activeDept, roleFilter, search])

  const isFirstLoad = loading && faculty.length === 0

  return (
    <div className={styles.page}>

      {/* ── Header — flat, mirrors Students page exactly ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon} aria-hidden="true">
            <Users size={22} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className={styles.title}>Faculty Members</h1>
            <p className={styles.subtitle}>
              {isFirstLoad
                ? 'Loading…'
                : `${faculty.length} faculty member${faculty.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={refetch}
            disabled={loading}
            aria-label="Refresh faculty list"
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
          </button>

          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setModalOpen(true)}
          >
            <UserPlus size={15} />
            Add Faculty
          </button>
        </div>
      </div>

      {/* ── Stats bar — only once data is available ── */}
      {!error && faculty.length > 0 && (
        <FacultyStatsBar faculty={faculty} />
      )}

      {/* ── Department tabs — mirrors Students program tabs ── */}
      {!error && faculty.length > 0 && (
        <div className={styles.tabsRow}>
          {['All', ...departments].map(dept => (
            <button
              key={dept}
              type="button"
              className={`${styles.tab} ${activeDept === dept ? styles.tabActive : ''}`}
              onClick={() => setActiveDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {/* ── Controls — search + role filter, mirrors Students controls ── */}
      {!error && faculty.length > 0 && (
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name, email, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            className={styles.roleSelect}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="All">All Roles</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Adjunct">Adjunct</option>
            <option value="Emeritus">Emeritus</option>
          </select>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorBanner} role="alert">{error}</div>
      )}

      {/* ── Skeleton — first load only ── */}
      {isFirstLoad && !error && (
        <div className={styles.tableWrap}>
          <div className={styles.skeleton}>
            <div className={styles.skeletonHeader} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        </div>
      )}

      {/* ── Table — show with stale data during refetch too ── */}
      {!error && (faculty.length > 0 || (!loading && faculty.length === 0)) && (
        <div className={styles.tableWrap}>
          <FacultyTable
            faculty={filtered}
            onRefresh={refetch}
          />
        </div>
      )}

      {/* ── Modal ── */}
      <AddFacultyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}

    </div>
  )
}
