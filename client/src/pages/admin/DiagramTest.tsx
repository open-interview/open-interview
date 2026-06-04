import { useState } from "react";
import { motion } from "framer-motion";
import { SEOHead } from "../../components/SEOHead";
import { AppLayout } from "../../components/layout/AppLayout";
import { EnhancedMermaid } from "../../components/EnhancedMermaid";
import { UnifiedCard } from "../../components/ui/UnifiedCard";
import { cn } from "../../lib/utils";
import { microInteractions } from "../../lib/motion";
import { AlertCircle, CheckCircle, ChevronDown } from "lucide-react";

const DIAGRAMS = [
  {
    name: "Flowchart TD",
    code: `graph TD
      A[Start] --> B{Is it working?}
      B -->|Yes| C[Great!]
      B -->|No| D[Fix it]
      D --> A`,
  },
  {
    name: "Sequence Diagram",
    code: `sequenceDiagram
      participant C as Client
      participant S as Server
      C->>S: GET /api/data
      S-->>C: 200 OK {data}
      C->>S: POST /api/action
      S-->>C: 201 Created`,
  },
  {
    name: "Class Diagram",
    code: `classDiagram
      class Animal {
        +String name
        +makeSound() void
      }
      class Dog {
        +String breed
        +fetch() void
      }
      Animal <|-- Dog`,
  },
  {
    name: "State Diagram",
    code: `stateDiagram-v2
      [*] --> Idle
      Idle --> Processing: Event
      Processing --> Completed: Success
      Processing --> Failed: Error
      Completed --> [*]
      Failed --> Idle: Retry`,
  },
  {
    name: "ER Diagram",
    code: `erDiagram
      USER ||--o{ ORDER : places
      USER {
        int id PK
        string name
      }
      ORDER ||--|{ LINE_ITEM : contains
      ORDER {
        int id PK
        int user_id FK
      }`,
  },
  {
    name: "Gantt Chart",
    code: `gantt
      title Project Timeline
      dateFormat YYYY-MM-DD
      section Planning
      Research: 2024-01-01, 7d
      Design: 2024-01-08, 5d
      section Development
      Frontend: 2024-01-15, 10d
      Backend: 2024-01-15, 10d`,
  },
  {
    name: "Git Graph",
    code: `gitGraph
      commit id: "init"
      branch feature
      checkout feature
      commit id: "feat-1"
      commit id: "feat-2"
      checkout main
      merge feature
      commit id: "release"`,
  },
  {
    name: "Pie Chart",
    code: `pie title Languages
      "JavaScript" : 40
      "Python" : 30
      "TypeScript" : 20
      "Other" : 10`,
  },
  {
    name: "Mindmap",
    code: `mindmap
      root((Tech Stack))
        Frontend
          React
          TypeScript
        Backend
          Node.js
          Python
        Database
          PostgreSQL
          Redis`,
  },
];

type RenderStatus = "pending" | "success" | "error";

export default function DiagramTest() {
  const [statuses, setStatuses] = useState<Record<number, RenderStatus>>({});

  const handleRenderResult = (index: number) => (success: boolean) => {
    setStatuses((prev) => ({ ...prev, [index]: success ? "success" : "error" }));
  };

  return (
    <>
      <SEOHead title="Diagram Smoke Tests" description="Dev utility for validating mermaid diagram rendering after version changes." />
      <AppLayout title="Diagram Smoke Tests" showBackOnMobile fullWidth>
        <div className="max-w-6xl mx-auto pb-24">
          <header className="hidden lg:flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              Diagram Smoke Tests
            </h1>
            <span className="text-xs text-muted-foreground">
              {Object.values(statuses).filter((s) => s === "success").length} / {DIAGRAMS.length} passed
            </span>
          </header>

          <header className="lg:hidden mb-4">
            <h1 className="text-lg font-bold">Diagram Smoke Tests</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIAGRAMS.map((diagram, index) => {
              const status = statuses[index] ?? "pending";
              return (
                <UnifiedCard key={index} className="overflow-hidden p-0" hover={false} press={false}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border,var(--border-default))]">
                    <h2 className="text-sm font-semibold">{diagram.name}</h2>
                    <StatusBadge status={status} />
                  </div>

                  <div className="p-4">
                    <EnhancedMermaid
                      chart={diagram.code}
                      onRenderResult={handleRenderResult(index)}
                    />
                  </div>

                  <details className="border-t border-[var(--card-border,var(--border-default))] group">
                    <motion.summary
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/30 cursor-pointer min-h-[44px]"
                      {...microInteractions.press}
                    >
                      <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                      Source
                    </motion.summary>
                    <div className="px-4 pb-3">
                      <pre className="text-[11px] leading-relaxed text-muted-foreground bg-muted/50 rounded p-3 overflow-x-auto font-mono whitespace-pre">{diagram.code}</pre>
                    </div>
                  </details>
                </UnifiedCard>
              );
            })}
          </div>
        </div>
      </AppLayout>
    </>
  );
}

function StatusBadge({ status }: { status: RenderStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
        Pending
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600">
        <CheckCircle className="w-3 h-3" />
        OK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-500">
      <AlertCircle className="w-3 h-3" />
      FAIL
    </span>
  );
}
