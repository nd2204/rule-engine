# JSON AST and Tabular Decision Representation

Rule conditions and actions are expressed as a safe, serializable JSON Abstract Syntax Tree (AST / JSON Logic) rather than unconstrained string evaluation. Decision sets can be represented as tabular Decision Tables mapped down to this AST, ensuring deterministic execution, code-injection safety, and bi-directional compatibility with future low-code/UI rule builders.
