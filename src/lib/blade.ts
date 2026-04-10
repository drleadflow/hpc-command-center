import 'dotenv/config'
import { initializeDb } from '@blade/db'

let initialized = false

export function ensureBlade(): void {
  if (initialized) return
  initializeDb()
  initialized = true
}

// Re-export everything from @blade/core for convenience
export {
  runAgentLoop,
  getAllToolDefinitions,
  resolveModelConfig,
  resolveSmartModelConfig,
  callModel,
  streamModel,
  calculateCost,
  formatCost,
  loadPersonality,
  buildMemoryAugmentedPrompt,
  runCodingPipeline,
  runWorkflow,
  listWorkflows,
  generatePredictions,
  getAllPredictions,
  detectEmotionalContext,
  awardXP,
  getUserLevel,
  getStreaks,
  checkAchievements,
  runEvolutionCycle,
  generateUsageReport,
  startTelegramBot,
  createVoiceRoom,
  generateParticipantToken,
  ingestDocument,
  searchDocuments,
} from '@blade/core'

export {
  initializeDb,
  conversations,
  messages,
  jobs,
  jobLogs,
  memories,
  skills,
  costEntries,
  employees,
  notifications,
} from '@blade/db'

export { loadConfig, logger } from '@blade/shared'
