# Pure In-Memory Decision Engine

The Business Rule Engine core operates as a pure, deterministic in-memory function `(Facts, Rules) => DecisionResult + EvaluationTrace`. The engine must never initiate I/O, database queries, or external network requests during rule evaluation; callers are strictly responsible for assembling all required Facts prior to calling the engine.
