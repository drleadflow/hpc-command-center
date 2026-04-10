import { getDb } from './sqlite.js';
function db() {
    return getDb();
}
function uuid() {
    return crypto.randomUUID();
}
function now() {
    return new Date().toISOString();
}
// ============================================================
// CONVERSATIONS
// ============================================================
export const conversations = {
    create(title) {
        const id = uuid();
        const ts = now();
        db().prepare('INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, title ?? null, ts, ts);
        return { id, title, createdAt: ts, updatedAt: ts };
    },
    get(id) {
        return db().prepare('SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM conversations WHERE id = ?').get(id);
    },
    list(limit = 50) {
        return db().prepare('SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM conversations ORDER BY updated_at DESC LIMIT ?').all(limit);
    },
    updateTitle(id, title) {
        db().prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?').run(title, now(), id);
    },
};
// ============================================================
// MESSAGES
// ============================================================
export const messages = {
    create(params) {
        const id = uuid();
        db().prepare('INSERT INTO messages (id, conversation_id, role, content, model, input_tokens, output_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, params.conversationId, params.role, params.content, params.model ?? null, params.inputTokens ?? 0, params.outputTokens ?? 0, now());
        return { id };
    },
    listByConversation(conversationId, limit = 100) {
        return db().prepare('SELECT id, conversation_id as conversationId, role, content, model, input_tokens as inputTokens, output_tokens as outputTokens, created_at as createdAt FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?').all(conversationId, limit);
    },
};
// ============================================================
// TOOL CALLS
// ============================================================
export const toolCalls = {
    create(params) {
        db().prepare('INSERT INTO tool_calls (id, message_id, conversation_id, tool_name, input_json, success, result_json, display, duration_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(uuid(), params.messageId, params.conversationId, params.toolName, JSON.stringify(params.input), params.success ? 1 : 0, params.result ? JSON.stringify(params.result) : null, params.display ?? null, params.durationMs ?? 0, now());
    },
    listByConversation(conversationId) {
        return db().prepare('SELECT * FROM tool_calls WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
    },
};
// ============================================================
// JOBS
// ============================================================
export const jobs = {
    create(params) {
        const id = uuid();
        const ts = now();
        db().prepare('INSERT INTO jobs (id, title, description, status, repo_url, branch, base_branch, agent_model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, params.title, params.description, 'queued', params.repoUrl, params.branch, params.baseBranch ?? 'main', params.agentModel ?? 'claude-sonnet-4-20250514', ts, ts);
        return { id };
    },
    get(id) {
        return db().prepare(`SELECT id, title, description, status, repo_url as repoUrl, branch, base_branch as baseBranch,
       container_name as containerName, pr_url as prUrl, pr_number as prNumber, agent_model as agentModel,
       total_cost_usd as totalCost, total_tool_calls as totalToolCalls, total_iterations as totalIterations,
       error, created_at as createdAt, updated_at as updatedAt, completed_at as completedAt
       FROM jobs WHERE id = ?`).get(id);
    },
    list(limit = 50) {
        return db().prepare(`SELECT id, title, status, repo_url as repoUrl, branch, pr_url as prUrl, total_cost_usd as totalCost,
       created_at as createdAt, completed_at as completedAt
       FROM jobs ORDER BY created_at DESC LIMIT ?`).all(limit);
    },
    updateStatus(id, status, extra) {
        const sets = ['status = ?', 'updated_at = ?'];
        const values = [status, now()];
        if (extra) {
            for (const [key, value] of Object.entries(extra)) {
                const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                sets.push(`${col} = ?`);
                values.push(value);
            }
        }
        values.push(id);
        db().prepare(`UPDATE jobs SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    },
};
// ============================================================
// JOB LOGS
// ============================================================
export const jobLogs = {
    add(jobId, level, message, data) {
        db().prepare('INSERT INTO job_logs (job_id, level, message, data_json, created_at) VALUES (?, ?, ?, ?, ?)').run(jobId, level, message, data ? JSON.stringify(data) : null, now());
    },
    listByJob(jobId, limit = 200) {
        return db().prepare('SELECT * FROM job_logs WHERE job_id = ? ORDER BY created_at ASC LIMIT ?').all(jobId, limit);
    },
};
// ============================================================
// MEMORIES
// ============================================================
export const memories = {
    create(params) {
        const id = uuid();
        const ts = now();
        db().prepare('INSERT INTO memories (id, type, content, tags_json, source, confidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, params.type, params.content, JSON.stringify(params.tags), params.source, params.confidence ?? 0.5, ts, ts);
        return { id };
    },
    search(query, limit = 10) {
        return db().prepare(`SELECT m.id, m.type, m.content, m.tags_json as tagsJson, m.source, m.confidence,
       m.access_count as accessCount, m.created_at as createdAt
       FROM memories m
       JOIN memories_fts fts ON m.rowid = fts.rowid
       WHERE memories_fts MATCH ?
       ORDER BY rank
       LIMIT ?`).all(query, limit);
    },
    getAll(limit = 100) {
        return db().prepare(`SELECT id, type, content, tags_json as tagsJson, source, confidence,
       access_count as accessCount, created_at as createdAt
       FROM memories ORDER BY confidence DESC, updated_at DESC LIMIT ?`).all(limit);
    },
    reinforce(id) {
        db().prepare('UPDATE memories SET confidence = MIN(confidence + 0.1, 1.0), access_count = access_count + 1, last_accessed_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), id);
    },
    decay(id) {
        db().prepare('UPDATE memories SET confidence = MAX(confidence - 0.1, 0.0), updated_at = ? WHERE id = ?').run(now(), id);
    },
    delete(id) {
        db().prepare('DELETE FROM memories WHERE id = ?').run(id);
    },
    prune(minConfidence = 0.1) {
        const result = db().prepare('DELETE FROM memories WHERE confidence < ?').run(minConfidence);
        return result.changes;
    },
};
// ============================================================
// SKILLS
// ============================================================
export const skills = {
    upsert(params) {
        const id = params.id ?? uuid();
        const ts = now();
        db().prepare(`INSERT INTO skills (id, name, description, system_prompt, tools_json, examples_json, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         description = excluded.description,
         system_prompt = excluded.system_prompt,
         tools_json = excluded.tools_json,
         examples_json = excluded.examples_json,
         version = version + 1,
         updated_at = excluded.updated_at`).run(id, params.name, params.description, params.systemPrompt, JSON.stringify(params.tools), JSON.stringify(params.examples ?? []), params.source ?? 'builtin', ts, ts);
        return { id };
    },
    get(name) {
        return db().prepare('SELECT * FROM skills WHERE name = ?').get(name);
    },
    list() {
        return db().prepare('SELECT id, name, description, version, success_rate as successRate, total_uses as totalUses, source FROM skills ORDER BY total_uses DESC').all();
    },
    recordUse(name, success) {
        const skill = db().prepare('SELECT success_rate, total_uses FROM skills WHERE name = ?').get(name);
        if (!skill)
            return;
        const newTotal = skill.total_uses + 1;
        const newRate = ((skill.success_rate * skill.total_uses) + (success ? 1 : 0)) / newTotal;
        db().prepare('UPDATE skills SET success_rate = ?, total_uses = ?, updated_at = ? WHERE name = ?').run(newRate, newTotal, now(), name);
    },
};
// ============================================================
// COST ENTRIES
// ============================================================
export const costEntries = {
    record(params) {
        db().prepare('INSERT INTO cost_entries (model, input_tokens, output_tokens, input_cost_usd, output_cost_usd, total_cost_usd, job_id, conversation_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(params.model, params.inputTokens, params.outputTokens, params.inputCostUsd, params.outputCostUsd, params.totalCostUsd, params.jobId ?? null, params.conversationId ?? null, now());
    },
    summary(days = 30) {
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const rows = db().prepare(`SELECT model, SUM(input_tokens) as inputTokens, SUM(output_tokens) as outputTokens,
       SUM(total_cost_usd) as totalUsd, DATE(created_at) as day
       FROM cost_entries WHERE created_at >= ? GROUP BY model, day ORDER BY day DESC`).all(since);
        const byModel = {};
        const byDay = {};
        let totalUsd = 0;
        let totalInput = 0;
        let totalOutput = 0;
        for (const row of rows) {
            byModel[row.model] = (byModel[row.model] ?? 0) + row.totalUsd;
            byDay[row.day] = (byDay[row.day] ?? 0) + row.totalUsd;
            totalUsd += row.totalUsd;
            totalInput += row.inputTokens;
            totalOutput += row.outputTokens;
        }
        return { totalUsd, byModel, byDay, tokenCount: { input: totalInput, output: totalOutput } };
    },
};
// ============================================================
// EMPLOYEES
// ============================================================
export const employees = {
    upsert(params) {
        const id = uuid();
        const ts = now();
        db().prepare(`INSERT INTO employees (id, slug, name, title, pillar, description, icon, active, archetype, onboarding_answers_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         active = excluded.active,
         archetype = excluded.archetype,
         onboarding_answers_json = excluded.onboarding_answers_json,
         updated_at = excluded.updated_at`).run(id, params.slug, params.name, params.title, params.pillar, params.description, params.icon ?? '', params.active ? 1 : 0, params.archetype ?? null, JSON.stringify(params.onboardingAnswers ?? {}), ts, ts);
        return { id };
    },
    get(slug) {
        return db().prepare(`SELECT id, slug, name, title, pillar, description, icon, active, archetype,
       onboarding_answers_json as onboardingAnswersJson, created_at as createdAt, updated_at as updatedAt
       FROM employees WHERE slug = ?`).get(slug);
    },
    list() {
        return db().prepare(`SELECT id, slug, name, title, pillar, description, icon, active, archetype,
       onboarding_answers_json as onboardingAnswersJson, created_at as createdAt
       FROM employees ORDER BY pillar, name`).all();
    },
    listActive() {
        return db().prepare(`SELECT id, slug, name, title, pillar, description, icon, archetype,
       onboarding_answers_json as onboardingAnswersJson
       FROM employees WHERE active = 1 ORDER BY pillar, name`).all();
    },
    activate(slug, archetype, answers) {
        db().prepare('UPDATE employees SET active = 1, archetype = ?, onboarding_answers_json = ?, updated_at = ? WHERE slug = ?').run(archetype, JSON.stringify(answers), now(), slug);
    },
    deactivate(slug) {
        db().prepare('UPDATE employees SET active = 0, updated_at = ? WHERE slug = ?').run(now(), slug);
    },
};
// ============================================================
// NOTIFICATIONS
// ============================================================
export const notifications = {
    create(params) {
        const id = uuid();
        db().prepare('INSERT INTO notifications (id, title, message, type, employee_slug, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, params.title, params.message, params.type ?? 'info', params.employeeSlug ?? null, now());
        return { id };
    },
    list(limit = 50) {
        return db().prepare(`SELECT id, title, message, type, read, employee_slug as employeeSlug, created_at as createdAt
       FROM notifications ORDER BY created_at DESC LIMIT ?`).all(limit);
    },
    markRead(id) {
        db().prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    },
    markAllRead() {
        db().prepare('UPDATE notifications SET read = 1 WHERE read = 0').run();
    },
    unreadCount() {
        const row = db().prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get();
        return row.count;
    },
};
// ============================================================
// XP EVENTS
// ============================================================
export const xpEvents = {
    record(params) {
        const id = uuid();
        db().prepare('INSERT INTO xp_events (id, action, xp, employee_id, created_at) VALUES (?, ?, ?, ?, ?)').run(id, params.action, params.xp, params.employeeId ?? null, now());
        return { id };
    },
    total() {
        const row = db().prepare('SELECT COALESCE(SUM(xp), 0) as total FROM xp_events').get();
        return row.total;
    },
    recent(limit = 20) {
        return db().prepare(`SELECT id, action, xp, employee_id as employeeId, created_at as createdAt
       FROM xp_events ORDER BY created_at DESC LIMIT ?`).all(limit);
    },
};
// ============================================================
// STREAKS
// ============================================================
export const streaks = {
    get(id) {
        return db().prepare(`SELECT id, name, current_streak as currentStreak, longest_streak as longestStreak,
       last_checked_in as lastCheckedIn, employee_id as employeeId
       FROM streaks WHERE id = ?`).get(id);
    },
    upsert(params) {
        db().prepare(`INSERT INTO streaks (id, name, current_streak, longest_streak, last_checked_in, employee_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         current_streak = excluded.current_streak,
         longest_streak = excluded.longest_streak,
         last_checked_in = excluded.last_checked_in`).run(params.id, params.name, params.currentStreak, params.longestStreak, params.lastCheckedIn, params.employeeId);
    },
    list(employeeId) {
        if (employeeId) {
            return db().prepare(`SELECT id, name, current_streak as currentStreak, longest_streak as longestStreak,
         last_checked_in as lastCheckedIn, employee_id as employeeId
         FROM streaks WHERE employee_id = ? ORDER BY name`).all(employeeId);
        }
        return db().prepare(`SELECT id, name, current_streak as currentStreak, longest_streak as longestStreak,
       last_checked_in as lastCheckedIn, employee_id as employeeId
       FROM streaks ORDER BY name`).all();
    },
};
// ============================================================
// ACHIEVEMENTS
// ============================================================
export const achievements = {
    unlock(id, name) {
        db().prepare(`INSERT OR IGNORE INTO achievements (id, name, unlocked_at) VALUES (?, ?, ?)`).run(id, name, now());
    },
    list() {
        return db().prepare(`SELECT id, name, unlocked_at as unlockedAt FROM achievements ORDER BY unlocked_at DESC`).all();
    },
    isUnlocked(id) {
        const row = db().prepare('SELECT id FROM achievements WHERE id = ?').get(id);
        return !!row;
    },
};
// ============================================================
// WORKFLOW RUNS
// ============================================================
export const workflowRuns = {
    create(params) {
        db().prepare('INSERT INTO workflow_runs (id, workflow_id, status, step_results_json, total_cost, started_at) VALUES (?, ?, ?, ?, ?, ?)').run(params.id, params.workflowId, 'running', '{}', 0, now());
    },
    get(id) {
        return db().prepare(`SELECT id, workflow_id as workflowId, status, step_results_json as stepResultsJson,
       total_cost as totalCost, started_at as startedAt, completed_at as completedAt
       FROM workflow_runs WHERE id = ?`).get(id);
    },
    update(id, params) {
        const sets = [];
        const values = [];
        if (params.status !== undefined) {
            sets.push('status = ?');
            values.push(params.status);
        }
        if (params.stepResultsJson !== undefined) {
            sets.push('step_results_json = ?');
            values.push(params.stepResultsJson);
        }
        if (params.totalCost !== undefined) {
            sets.push('total_cost = ?');
            values.push(params.totalCost);
        }
        if (params.completedAt !== undefined) {
            sets.push('completed_at = ?');
            values.push(params.completedAt);
        }
        if (sets.length === 0)
            return;
        values.push(id);
        db().prepare(`UPDATE workflow_runs SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    },
    list(limit = 50) {
        return db().prepare(`SELECT id, workflow_id as workflowId, status, step_results_json as stepResultsJson,
       total_cost as totalCost, started_at as startedAt, completed_at as completedAt
       FROM workflow_runs ORDER BY started_at DESC LIMIT ?`).all(limit);
    },
};
// ============================================================
// HANDOFFS
// ============================================================
export const handoffs = {
    create(params) {
        db().prepare('INSERT INTO handoffs (id, from_employee, to_employee, reason, context, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(params.id, params.fromEmployee, params.toEmployee, params.reason, params.context, params.priority, 'pending', now());
    },
    get(id) {
        return db().prepare(`SELECT id, from_employee as fromEmployee, to_employee as toEmployee, reason, context, priority, status, created_at as createdAt, completed_at as completedAt
       FROM handoffs WHERE id = ?`).get(id);
    },
    listPendingForEmployee(toEmployee) {
        return db().prepare(`SELECT id, from_employee as fromEmployee, to_employee as toEmployee, reason, context, priority, status, created_at as createdAt, completed_at as completedAt
       FROM handoffs WHERE to_employee = ? AND status = 'pending' ORDER BY
         CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END`).all(toEmployee);
    },
    updateStatus(id, status) {
        const completedAt = status === 'completed' ? now() : null;
        db().prepare('UPDATE handoffs SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, id);
    },
    clear() {
        db().prepare('DELETE FROM handoffs').run();
    },
};
// ============================================================
// EVOLUTION EVENTS
// ============================================================
export const evolutionEvents = {
    record(params) {
        db().prepare('INSERT INTO evolution_events (id, type, description, before_value, after_value, impact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(uuid(), params.type, params.description, params.before ?? null, params.after ?? null, params.impact ?? null, now());
    },
    recent(limit = 20) {
        return db().prepare(`SELECT id, type, description, before_value as beforeValue, after_value as afterValue, impact, created_at as createdAt
       FROM evolution_events ORDER BY created_at DESC LIMIT ?`).all(limit);
    },
    countByType() {
        const rows = db().prepare('SELECT type, COUNT(*) as count FROM evolution_events GROUP BY type').all();
        const result = {};
        for (const row of rows) {
            result[row.type] = row.count;
        }
        return result;
    },
};
// ============================================================
// USER PROFILE
// ============================================================
export const userProfile = {
    get() {
        return db().prepare(`SELECT id, total_xp as totalXp, level, created_at as createdAt
       FROM user_profile WHERE id = 'default'`).get();
    },
    update(params) {
        db().prepare(`INSERT INTO user_profile (id, total_xp, level, created_at)
       VALUES ('default', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         total_xp = excluded.total_xp,
         level = excluded.level`).run(params.totalXp, params.level, now());
    },
};
// ============================================================
// DAILY PRIORITIES
// ============================================================
export const priorities = {
    create(params) {
        const id = uuid();
        const today = new Date().toISOString().slice(0, 10);
        db().prepare('INSERT INTO daily_priorities (id, title, description, emoji, urgency, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, params.title, params.description ?? null, params.emoji ?? '⚡', params.urgency ?? 'normal', today, now());
        return { id };
    },
    listToday() {
        const today = new Date().toISOString().slice(0, 10);
        return db().prepare(`SELECT id, title, description, emoji, urgency, completed, date, created_at as createdAt
       FROM daily_priorities WHERE date = ? ORDER BY
       CASE urgency WHEN 'urgent' THEN 0 WHEN 'important' THEN 1 ELSE 2 END,
       created_at ASC`).all(today);
    },
    complete(id) {
        db().prepare('UPDATE daily_priorities SET completed = 1 WHERE id = ?').run(id);
    },
    uncomplete(id) {
        db().prepare('UPDATE daily_priorities SET completed = 0 WHERE id = ?').run(id);
    },
    delete(id) {
        db().prepare('DELETE FROM daily_priorities WHERE id = ?').run(id);
    },
};
//# sourceMappingURL=repositories.js.map