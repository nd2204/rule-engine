# Decision Definition Packaging and Self-Contained Artifacts

Each Decision and its associated Rules are packaged as a single self-contained JSON/YAML artifact identified by `(id, version)`. The artifact encapsulates metadata, input schema validation constraints, hit policy, and rules definitions, making each decision fully portable, version-controlled, and easily distributed via APIs or Git.
