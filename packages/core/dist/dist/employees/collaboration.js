import crypto from 'node:crypto';
import { getEmployee } from './registry.js';
import { logger } from '@blade/shared';
// In-memory store for handoffs (persisted per process lifecycle)
const handoffStore = new Map();
export function requestHandoff(handoff) {
    const fromEmployee = getEmployee(handoff.fromEmployee);
    if (!fromEmployee) {
        throw new Error(`Source employee "${handoff.fromEmployee}" not found`);
    }
    const toEmployee = getEmployee(handoff.toEmployee);
    if (!toEmployee) {
        throw new Error(`Target employee "${handoff.toEmployee}" not found`);
    }
    const entry = {
        ...handoff,
        id: crypto.randomUUID(),
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    handoffStore.set(entry.id, entry);
    logger.info('Collaboration', `Handoff from "${handoff.fromEmployee}" to "${handoff.toEmployee}": ${handoff.reason} [${handoff.priority}]`);
    return entry;
}
export function getHandoffsForEmployee(employeeId) {
    return [...handoffStore.values()]
        .filter(h => h.toEmployee === employeeId && h.status === 'pending')
        .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    });
}
export function acceptHandoff(handoffId) {
    const handoff = handoffStore.get(handoffId);
    if (handoff) {
        handoffStore.set(handoffId, { ...handoff, status: 'accepted' });
    }
}
export function completeHandoff(handoffId) {
    const handoff = handoffStore.get(handoffId);
    if (handoff) {
        handoffStore.set(handoffId, { ...handoff, status: 'completed' });
    }
}
export function buildCollaborationContext(employeeId) {
    const pendingHandoffs = getHandoffsForEmployee(employeeId);
    if (pendingHandoffs.length === 0) {
        return '';
    }
    const lines = [
        '--- Pending Handoffs ---',
        `You have ${pendingHandoffs.length} pending handoff(s) from other employees:`,
        '',
    ];
    for (const handoff of pendingHandoffs) {
        const from = getEmployee(handoff.fromEmployee);
        const fromName = from ? from.name : handoff.fromEmployee;
        lines.push(`[${handoff.priority.toUpperCase()}] From ${fromName}:`);
        lines.push(`  Reason: ${handoff.reason}`);
        lines.push(`  Context: ${handoff.context}`);
        lines.push(`  Received: ${handoff.createdAt}`);
        lines.push('');
    }
    lines.push('Please address these handoffs as part of your response.');
    return lines.join('\n');
}
export function clearHandoffs() {
    handoffStore.clear();
}
//# sourceMappingURL=collaboration.js.map