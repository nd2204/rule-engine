# Management Layer Owns Persistence; Core Stays Pure

Drafts, Test Cases, Published Decision Versions and the Latest Pointer must survive restarts, yet ADR-0001 forbids I/O inside evaluation. We therefore split the system into a pure in-memory core (Registry + Evaluate, unchanged by this ADR) and a management layer in the same service process that stores lifecycle state in SQLite and pushes Published Decision Versions into the core's Registry. Callers reach both over HTTP; the core remains an independent Go package so latency benchmarks measure it in-process.

## Considered Options

- **Files / Git as the store**: matches ADR-0004 but makes Publish + Latest Pointer moves non-atomic. Artifacts stay the import/export format instead.
- **PostgreSQL**: extra infrastructure with no benefit at thesis scale.
- **Callers embed the core and pull versions from the management layer**: deferred to future work; it adds a version-distribution problem.
