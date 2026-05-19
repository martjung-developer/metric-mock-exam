import { subscribeApprovalStream } from '@/lib/services/approval/approval.stream'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<Response> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder()
      let isClosed = false
      const safeEnqueue = (payload: string) => {
        if (isClosed) {
          return
        }
        try {
          controller.enqueue(enc.encode(payload))
        } catch {
          isClosed = true
        }
      }

      safeEnqueue(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`)

      const unsubscribe = subscribeApprovalStream((event) => {
        safeEnqueue(`event: approval\ndata: ${JSON.stringify(event)}\n\n`)
      })

      const heartbeat = setInterval(() => {
        safeEnqueue(`event: heartbeat\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`)
      }, 10000)

      return () => {
        isClosed = true
        clearInterval(heartbeat)
        unsubscribe()
      }
    },
    cancel() {
      // no-op
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
