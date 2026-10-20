import styles from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

export function SkeletonRow() {
  return (
    <tr>
      <td>
        <div className={styles.skelCell}>
          <div className={styles.skeleton} style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className={styles.skeleton} style={{ width: '75%', height: 11 }} />
            <div className={styles.skeleton} style={{ width: '40%', height: 10 }} />
          </div>
        </div>
      </td>
      <td><div className={styles.skeleton} style={{ width: 90, height: 20, borderRadius: 20 }} /></td>
      <td><div className={styles.skeleton} style={{ width: 72, height: 20, borderRadius: 20 }} /></td>
      <td><div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 20 }} /></td>
      <td><div className={styles.skeleton} style={{ width: 32, height: 18 }} /></td>
      <td>
        <div className={styles.skelActions}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.skeleton} style={{ width: 30, height: 30, borderRadius: 8 }} />
          ))}
        </div>
      </td>
    </tr>
  )
}