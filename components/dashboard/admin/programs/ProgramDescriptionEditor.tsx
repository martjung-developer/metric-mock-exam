/**
 * components/admin/programs/ProgramDescriptionEditor.tsx
 *
 * Reusable inline description editor.
 * Used both in ProgramCard and ProgramModal.
 * Pure UI — all state lives in the parent via props.
 */

import { Pencil, Save, Loader2, CheckCircle2 } from 'lucide-react'

interface ProgramDescriptionEditorProps {
  /** Current persisted description (may be null). */
  description:  string | null
  /** True when this particular editor instance is active. */
  isEditing:    boolean
  /** Current textarea value while editing. */
  editDesc:     string
  /** True while the save request is in-flight. */
  savingDesc:   boolean
  /** Non-empty string when an error occurred during save. */
  saveDescError:string
  /** True briefly after a successful save. */
  saveDescOk:   boolean
  onStartEdit:  () => void
  onChangeDesc: (value: string) => void
  onSave:       () => void
  onCancel:     () => void
  /** Visual size variant — 'card' uses slightly smaller type than 'modal'. */
  variant?:     'card' | 'modal'
}

export function ProgramDescriptionEditor({
  description,
  isEditing,
  editDesc,
  savingDesc,
  saveDescError,
  saveDescOk,
  onStartEdit,
  onChangeDesc,
  onSave,
  onCancel,
  variant = 'card',
}: ProgramDescriptionEditorProps) {
  const isModal  = variant === 'modal'
  const fontSize = isModal ? '0.8rem' : '0.78rem'
  const descSize = isModal ? '0.83rem' : '0.76rem'

  if (isEditing) {
    return (
      <div style={{ marginTop: isModal ? '0' : '0.6rem' }}>
        <textarea
          style={{
            width:      '100%',
            fontSize,
            borderRadius: 7,
            border:     '1.5px solid #cbd5e1',
            padding:    isModal ? '0.5rem 0.6rem' : '0.45rem 0.6rem',
            resize:     'vertical',
            minHeight:  isModal ? 72 : 60,
            fontFamily: 'inherit',
            boxSizing:  'border-box',
          }}
          value={editDesc}
          onChange={(e) => onChangeDesc(e.target.value)}
          placeholder="Enter program description…"
        />

        {saveDescError && (
          <p style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 3 }}>
            {saveDescError}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
          <button
            style={{
              flex:            isModal ? 'none' : 1,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             4,
              fontSize:        isModal ? '0.76rem' : '0.74rem',
              padding:         isModal ? '0.35rem 0.8rem' : '0.3rem 0.6rem',
              background:      '#0d2540',
              color:           '#fff',
              border:          'none',
              borderRadius:    7,
              cursor:          savingDesc ? 'not-allowed' : 'pointer',
              opacity:         savingDesc ? 0.7 : 1,
            }}
            onClick={onSave}
            disabled={savingDesc}
          >
            {savingDesc ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            ) : saveDescOk ? (
              <CheckCircle2 size={12} color="#059669" />
            ) : (
              <Save size={12} />
            )}
            {savingDesc ? 'Saving…' : saveDescOk ? 'Saved!' : 'Save'}
          </button>

          <button
            style={{
              fontSize:     isModal ? '0.76rem' : '0.74rem',
              padding:      isModal ? '0.35rem 0.8rem' : '0.3rem 0.6rem',
              background:   '#f1f5f9',
              border:       'none',
              borderRadius: 7,
              cursor:       'pointer',
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'flex-start',
        gap:        '0.35rem',
        marginTop:  isModal ? 0 : '0.45rem',
      }}
    >
      <p
        style={{
          flex:       1,
          fontSize:   descSize,
          color:      '#64748b',
          lineHeight: 1.5,
          margin:     0,
        }}
      >
        {description || (
          <em style={{ color: '#94a3b8' }}>
            {isModal ? 'No description added.' : 'No description'}
          </em>
        )}
      </p>
      <button
        title="Edit description"
        style={{
          flexShrink:  0,
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          color:       '#94a3b8',
          padding:     '0.1rem',
          marginTop:   '0.1rem',
        }}
        onClick={onStartEdit}
      >
        <Pencil size={12} />
      </button>
    </div>
  )
}