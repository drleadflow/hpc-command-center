"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// ─── Types ───────────────────────────────────────────────────────
interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  dateAdded?: string;
  assignedTo?: string;
  [key: string]: unknown;
}

interface StageDefinition {
  id: string;
  label: string;
  color: string;
}

interface PipelineProps {
  contacts: GHLContact[];
  stages: Record<string, string>;
  stageDefinitions: StageDefinition[];
  onDragEnd: (result: DropResult) => void;
  onContactClick: (contact: GHLContact) => void;
}

function contactName(c: GHLContact): string {
  return c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown";
}

export default function Pipeline({ contacts, stages, stageDefinitions, onDragEnd, onContactClick }: PipelineProps) {
  const STAGES = stageDefinitions;
  // Group contacts by stage
  const grouped: Record<string, GHLContact[]> = {};
  for (const s of STAGES) {
    grouped[s.id] = [];
  }
  for (const contact of contacts) {
    const stageId = stages[contact.id] || "new-lead";
    if (grouped[stageId]) {
      grouped[stageId].push(contact);
    } else {
      grouped["new-lead"].push(contact);
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {STAGES.map((stage) => (
          <Droppable key={stage.id} droppableId={stage.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-shrink-0 rounded-2xl p-3"
                style={{
                  width: 260,
                  minHeight: 300,
                  backgroundColor: snapshot.isDraggingOver
                    ? "var(--accent-bg)"
                    : "var(--surface)",
                  border: "1px solid var(--border)",
                  transition: "background-color 0.15s",
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${stage.color}18`,
                      color: stage.color,
                    }}
                  >
                    {grouped[stage.id].length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {grouped[stage.id].map((contact, idx) => (
                    <Draggable key={contact.id} draggableId={contact.id} index={idx}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          onClick={() => onContactClick(contact)}
                          className="rounded-xl p-3 cursor-pointer transition-shadow"
                          style={{
                            backgroundColor: "var(--bg)",
                            border: "1px solid var(--border)",
                            boxShadow: dragSnapshot.isDragging
                              ? "0 8px 24px rgba(0,0,0,0.12)"
                              : "none",
                            ...dragProvided.draggableProps.style,
                          }}
                        >
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text)" }}
                          >
                            {contactName(contact)}
                          </p>
                          {contact.phone && (
                            <p
                              className="text-xs mt-1 truncate"
                              style={{ color: "var(--muted)" }}
                            >
                              {contact.phone}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {contact.dateAdded && (
                              <span
                                className="text-xs"
                                style={{ color: "var(--muted)" }}
                              >
                                {new Date(contact.dateAdded).toLocaleDateString()}
                              </span>
                            )}
                            {contact.assignedTo && (
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                                style={{
                                  backgroundColor: "var(--accent-bg)",
                                  color: "var(--accent-text)",
                                }}
                              >
                                {(contact.assignedTo as string).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
