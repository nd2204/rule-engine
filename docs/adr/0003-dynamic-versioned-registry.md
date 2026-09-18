# Dynamic In-Memory Registry with Explicit Versioning

Decisions and their associated Rule Sets are stored in an in-memory registry keyed by `(decisionId, version)`. Callers evaluate rules by referencing a specific version or defaulting to `latest` (numbering and `latest` semantics refined by ADR-0007). This enables sub-millisecond execution, hot-reloading at runtime without service redeployment, side-by-side execution for A/B testing, and instant rollback.
