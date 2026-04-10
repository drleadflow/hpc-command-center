export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import {
  listTodayPriorities,
  createPriority,
  completePriority,
  uncompletePriority,
  deletePriority,
} from '@/lib/data/priorities'

export async function GET() {
  try {
    const list = await listTodayPriorities()
    return Response.json({ success: true, data: list })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { title: string; description?: string; emoji?: string; urgency?: string }

    if (!body.title) {
      return Response.json({ success: false, error: 'title is required' }, { status: 400 })
    }

    const result = await createPriority(body)
    return Response.json({ success: true, data: result })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; action: 'complete' | 'uncomplete' | 'delete' }

    if (body.action === 'complete') await completePriority(body.id)
    else if (body.action === 'uncomplete') await uncompletePriority(body.id)
    else if (body.action === 'delete') await deletePriority(body.id)

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
