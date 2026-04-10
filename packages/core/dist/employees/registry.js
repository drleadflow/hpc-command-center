import { getDb } from '@blade/db';
// Global singleton registry (survives module reloads)
const REGISTRY_KEY = '__blade_employee_registry__';
const _registry = globalThis[REGISTRY_KEY]
    ?? (globalThis[REGISTRY_KEY] = new Map());
const ARCHETYPE_KEY = '__blade_active_archetype__';
function db() {
    return getDb();
}
function now() {
    return new Date().toISOString();
}
export function registerEmployee(def) {
    _registry.set(def.id, def);
}
export function getEmployee(id) {
    return _registry.get(id);
}
export function getAllEmployees() {
    return [..._registry.values()];
}
export function getEmployeesByPillar(pillar) {
    return [..._registry.values()].filter(e => e.pillar === pillar);
}
export function activateEmployee(id, archetype) {
    const def = _registry.get(id);
    if (!def) {
        throw new Error(`Employee "${id}" not found in registry`);
    }
    const existing = db().prepare('SELECT employee_id FROM active_employees WHERE employee_id = ?').get(id);
    if (existing) {
        db().prepare('UPDATE active_employees SET archetype = ?, activated_at = ? WHERE employee_id = ?').run(archetype, now(), id);
    }
    else {
        db().prepare('INSERT INTO active_employees (employee_id, activated_at, archetype, onboarding_complete) VALUES (?, ?, ?, 0)').run(id, now(), archetype);
    }
}
export function deactivateEmployee(id) {
    db().prepare('DELETE FROM active_employees WHERE employee_id = ?').run(id);
}
export function getActiveEmployees() {
    const rows = db().prepare(`SELECT employee_id as employeeId, activated_at as activatedAt, archetype, onboarding_complete as onboardingComplete
     FROM active_employees ORDER BY activated_at ASC`).all();
    return rows.map(row => ({
        ...row,
        onboardingComplete: Boolean(row.onboardingComplete),
    }));
}
export function getActiveArchetype() {
    return globalThis[ARCHETYPE_KEY] ?? 'coach';
}
export function setArchetype(archetype) {
    globalThis[ARCHETYPE_KEY] = archetype;
}
//# sourceMappingURL=registry.js.map