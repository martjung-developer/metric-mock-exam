type ApprovalStreamEvent = {
  type: 'approval_updated' | 'approval_submitted'
  entityType: 'exam' | 'question' | 'question_bank'
  entityId: string
  status?: string
  at: string
}

type Listener = (event: ApprovalStreamEvent) => void

const listeners = new Set<Listener>()

export function subscribeApprovalStream(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitApprovalStreamEvent(event: ApprovalStreamEvent): void {
  for (const listener of listeners) {
    listener(event)
  }
}

