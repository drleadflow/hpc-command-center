import type { EmployeeDefinition, Pillar, Archetype, ActiveEmployee } from './types.js';
export declare function registerEmployee(def: EmployeeDefinition): void;
export declare function getEmployee(id: string): EmployeeDefinition | undefined;
export declare function getAllEmployees(): EmployeeDefinition[];
export declare function getEmployeesByPillar(pillar: Pillar): EmployeeDefinition[];
export declare function activateEmployee(id: string, archetype: Archetype): void;
export declare function deactivateEmployee(id: string): void;
export declare function getActiveEmployees(): ActiveEmployee[];
export declare function getActiveArchetype(): Archetype;
export declare function setArchetype(archetype: Archetype): void;
//# sourceMappingURL=registry.d.ts.map