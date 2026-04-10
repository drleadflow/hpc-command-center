export const runtime = 'nodejs'

import { NextRequest } from 'next/server'

const BASE_SYSTEM_PROMPT = `You are Blade, an AI super agent embedded in the Blade Command Center for Dr. Emeka.
You are helpful, direct, and capable. You have tools for memory, file operations, and shell commands.
When the user tells you a preference or important fact, save it to memory.
When a topic comes up that you might have context on, use recall_memory.
Be concise but thorough.`

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json()
    const { message, conversationId: existingConversationId } = body as {
      message: string
      conversationId?: string
    }

    if (!message || typeof message !== 'string') {
      return Response.json(
        { success: false, error: 'message is required and must be a string' },
        { status: 400 }
      )
    }

    // Dynamic imports so the route doesn't crash if Blade engine isn't configured
    const {
      ensureBlade,
      runAgentLoop,
      getAllToolDefinitions,
      loadPersonality,
      buildMemoryAugmentedPrompt,
      loadConfig,
      conversations,
      messages,
      costEntries,
    } = await import('@/lib/blade')

    ensureBlade()

    const conversation = existingConversationId
      ? conversations.get(existingConversationId) ?? conversations.create(message.slice(0, 100))
      : conversations.create(message.slice(0, 100))

    const conversationId = conversation.id

    // Record user message
    messages.create({
      conversationId,
      role: 'user',
      content: message,
    })

    // Load prior messages for context
    const priorMessages = messages.listByConversation(conversationId)
    const agentMessages = priorMessages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const config = loadConfig()
    const personality = loadPersonality()
    const systemPrompt = buildMemoryAugmentedPrompt(
      personality ? `${personality}\n\n${BASE_SYSTEM_PROMPT}` : BASE_SYSTEM_PROMPT,
      message
    )

    const context = {
      conversationId,
      userId: 'web-user',
      modelId: config.defaultModel,
      maxIterations: config.maxIterations,
      costBudget: config.costBudget,
    }

    const tools = getAllToolDefinitions()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown): void => {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        }

        try {
          const options = {
            systemPrompt,
            messages: agentMessages,
            tools,
            context,
            streaming: true,
            onTextDelta(text: string) {
              sendEvent('text', { conversationId, text })
            },
            onToolCall(result: { toolName: string; input: unknown; success: boolean; display?: string; durationMs?: number }) {
              sendEvent('tool_call', {
                conversationId,
                toolName: result.toolName,
                input: result.input,
                success: result.success,
                display: result.display,
                durationMs: result.durationMs,
              })
            },
            onTurn(turn: { iteration: number; response: { stopReason: string; inputTokens: number; outputTokens: number }; costSoFar: number }) {
              sendEvent('turn', {
                conversationId,
                iteration: turn.iteration,
                stopReason: turn.response.stopReason,
                costSoFar: turn.costSoFar,
              })
            },
          }

          const result = await runAgentLoop(options)

          // Record assistant message in DB
          messages.create({
            conversationId,
            role: 'assistant',
            content: result.finalResponse,
            model: context.modelId,
            inputTokens: result.turns.reduce((sum: number, t: { response: { inputTokens: number } }) => sum + t.response.inputTokens, 0),
            outputTokens: result.turns.reduce((sum: number, t: { response: { outputTokens: number } }) => sum + t.response.outputTokens, 0),
          })

          // Record cost entry
          const totalInputTokens = result.turns.reduce((sum: number, t: { response: { inputTokens: number } }) => sum + t.response.inputTokens, 0)
          const totalOutputTokens = result.turns.reduce((sum: number, t: { response: { outputTokens: number } }) => sum + t.response.outputTokens, 0)

          if (result.totalCost > 0) {
            costEntries.record({
              model: context.modelId,
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              inputCostUsd: result.totalCost * 0.4,
              outputCostUsd: result.totalCost * 0.6,
              totalCostUsd: result.totalCost,
              conversationId,
            })
          }

          // Update conversation title if newly created
          if (!existingConversationId && result.finalResponse) {
            const title = result.finalResponse.slice(0, 100)
            conversations.updateTitle(conversationId, title)
          }

          sendEvent('done', {
            conversationId,
            finalResponse: result.finalResponse,
            totalCost: result.totalCost,
            totalToolCalls: result.totalToolCalls,
            stopReason: result.stopReason,
          })
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Agent loop failed'
          console.error(`[blade/chat] Agent loop error: ${errorMessage} (conv: ${conversationId})`)
          sendEvent('error', { conversationId, error: errorMessage })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error(`[blade/chat] Route error: ${errorMessage}`)
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
