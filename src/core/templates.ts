/**
 * Starter templates for common diagram types
 */

export interface DiagramTemplate {
    id: string;
    name: string;
    code: string;
}

export const TEMPLATES: readonly DiagramTemplate[] = [
    {
        id: 'flowchart',
        name: 'Flowchart',
        code: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`,
    },
    {
        id: 'sequence',
        name: 'Sequence',
        code: `sequenceDiagram
    participant U as User
    participant A as App
    participant S as Server
    U->>A: Click "Save"
    A->>S: POST /documents
    S-->>A: 201 Created
    A-->>U: Show confirmation`,
    },
    {
        id: 'class',
        name: 'Class',
        code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +fetch() void
    }
    class Cat {
        +scratch() void
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
    },
    {
        id: 'state',
        name: 'State',
        code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: fetch
    Loading --> Success: resolve
    Loading --> Error: reject
    Error --> Loading: retry
    Success --> [*]`,
    },
    {
        id: 'er',
        name: 'Entity Relationship',
        code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        date created
    }`,
    },
    {
        id: 'gantt',
        name: 'Gantt',
        code: `gantt
    title Project Plan
    dateFormat YYYY-MM-DD
    section Design
        Research       :a1, 2025-01-01, 7d
        Wireframes     :a2, after a1, 5d
    section Build
        Implementation :b1, after a2, 14d
        Testing        :b2, after b1, 7d`,
    },
    {
        id: 'pie',
        name: 'Pie',
        code: `pie title Time Spent
    "Coding" : 45
    "Meetings" : 25
    "Reviews" : 20
    "Coffee" : 10`,
    },
    {
        id: 'mindmap',
        name: 'Mindmap',
        code: `mindmap
  root((Project))
    Goals
      Ship v1
      Gather feedback
    Team
      Design
      Engineering
    Risks
      Scope creep`,
    },
    {
        id: 'timeline',
        name: 'Timeline',
        code: `timeline
    title Product History
    2023 : Idea : Prototype
    2024 : Beta launch
    2025 : v1.0 release : Mobile app`,
    },
    {
        id: 'git',
        name: 'Git Graph',
        code: `gitGraph
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
    commit`,
    },
    {
        id: 'journey',
        name: 'User Journey',
        code: `journey
    title Ordering Coffee
    section Arrive
      Walk in: 4: Customer
      Queue: 2: Customer
    section Order
      Choose drink: 5: Customer
      Pay: 3: Customer, Barista
    section Enjoy
      Drink coffee: 5: Customer`,
    },
];
