# Specification: Core Business Rule Engine (Go In-Memory)

## Problem Statement

Hiện nay, các quyết định nghiệp vụ (business decisions) như chính sách chiết khấu/khuyến mãi, phê duyệt đơn từ, điều kiện đổi trả hay logic kích hoạt lệnh điều khiển trong hệ thống IoT đang bị gắn chặt (hardcoded) vào mã nguồn của từng ứng dụng. Điều này dẫn tới:
- Mọi thay đổi chính sách đều đòi hỏi lập trình viên phải sửa code, viết lại test, build và triển khai lại toàn bộ dịch vụ, khiến thời gian đưa chính sách vào vận hành (time-to-market) kéo dài nhiều ngày.
- Chưa có một cơ chế tiêu chuẩn, độc lập với domain để mô hình hoá, quản lý phiên bản, kiểm thử và thực thi các quyết định nghiệp vụ.
- Khi xảy ra khiếu nại hoặc sự cố vận hành, hệ thống khó có thể tái hiện chính xác lý do tại sao một quyết định đã được đưa ra (thiếu explainability/audit trace).

## Solution

Phase 1 xây dựng một service gồm hai lớp: lõi **Business Rule Engine (BRE)** thuần túy trong bộ nhớ (**Pure In-Memory**) bằng **Go (Golang)**, và một **lớp quản trị** quản lý vòng đời Decision. Rule Author thao tác qua một CLI mỏng; Caller gọi đánh giá qua HTTP. Web UI thuộc Phase 2.

1. **Domain-Agnostic**: Hoạt động trung lập, được kiểm chứng bằng 2 pilot domain hoàn toàn tương phản: **Retail ERP / POS** và **Smart IoT Irrigation**, với 4 Decision phủ đủ 4 Hit Policy.
2. **Safe Expression Representation**: Rule được soạn dưới dạng **Decision Table** (YAML, mỗi ô là một điều kiện đơn giản được phân tích cú pháp) hoặc trực tiếp dưới dạng **JSON AST** cho các điều kiện trên tập hợp. Không dùng `eval`, ngăn chặn 100% rủi ro code injection.
3. **Deterministic Conflict Resolution**: Hỗ trợ đầy đủ 4 Hit Policy chuẩn hóa (`FIRST`, `UNIQUE`, `PRIORITY`, `COLLECT`).
4. **Dynamic In-Memory Registry**: Nạp nóng (hot-reload) các Decision Version đã Published theo cặp `(decisionId, version)` mà không làm gián đoạn goroutines đang đọc; `latest` được phân giải qua Latest Pointer tường minh (ADR-0007).
5. **Evaluation Trace**: Mọi Decision Result kèm Trace Summary; Evaluation Trace đầy đủ (chi tiết đến từng điều kiện con, snapshot Facts, thời gian thực thi) được tạo khi Caller yêu cầu và luôn có trong Simulation. Mọi quyết định đều replay được từ Facts và Trace Summary.
6. **Decision Lifecycle**: Draft → Simulation (Test Case + so sánh với Latest) → Publish → Rollback, lưu trữ bằng SQLite ở lớp quản trị; lõi vẫn không có I/O (ADR-0006).

## User Stories

1. As an Integrator for a retail POS, I want to submit cart facts to the engine and evaluate promotional discounts using the `COLLECT` hit policy, so that all qualifying discount rules are returned as an output list.
2. As a Rule Author, I want to write collection conditions like `some` or `all` over cart items (e.g., checking if cart contains an item from category 'BEVERAGE'), so that bundle and category-specific rules can be expressed naturally.
3. As an Integrator for an IoT backend, I want to evaluate soil moisture and weather forecast telemetry through the engine using the `FIRST` hit policy, so that the highest-priority irrigation command is determined in under a millisecond.
4. As a Rule Author, I want to write a Decision's rules as a Decision Table in YAML, with one Rule per row and one simple condition per cell, so that I can change a policy without writing nested JSON AST by hand.
5. As a Rule Author, I want to import and export a Decision as a single self-contained JSON/YAML artifact, so that it can be version-controlled in Git and distributed easily.
6. As a Rule Author, I want to create several Drafts of a Decision from its current Latest version, so that an urgent fix does not have to wait for a larger change in progress.
7. As a Rule Author, I want Simulation to run all Test Cases of a Draft and list the Facts whose Decision Result differs from the Latest version, so that I can see the exact effect of my change before publishing.
8. As a Rule Author, I want Publish to be refused unless the Draft has at least one Test Case and all of them pass, so that every change to a policy is deliberate and checked.
9. As a Rule Author, I want to be warned when publishing a Stale Draft or a Draft with a Breaking Change to the input schema, so that I neither overwrite a newer fix unknowingly nor break Callers that do not send a new mandatory field.
10. As a Rule Author, I want Publish to take effect immediately and Rollback to move the Latest Pointer back to an earlier version, so that a faulty policy can be withdrawn instantly without restarting the service.
11. As an Integrator, I want to request an exact Decision Version (e.g., `3`) or `latest`, so that I can pin a version, run A/B comparisons and roll out changes safely.
12. As an Integrator, I want every Decision Result to carry a Trace Summary and to request a full Evaluation Trace on demand, so that I can explain any decision without paying the full trace cost on every call.
13. As an Integrator, I want to replay a past evaluation from its Facts snapshot and Decision Version, so that I can reproduce the full Evaluation Trace of any past decision.
14. As an Integrator, I want the engine to evaluate facts purely in RAM without performing database queries or network calls, so that rule evaluation remains deterministic, thread-safe, and sub-millisecond fast.
15. As an Integrator, I want the engine to safely handle missing or null fact fields without crashing or throwing runtime panics, so that incomplete sensor readings or optional customer profiles do not disrupt service operations.
16. As a Rule Author, I want the engine to reject the evaluation and raise a clear violation error when a decision configured with the `UNIQUE` hit policy matches multiple rules, so that overlapping customer-tier ranges are caught reliably.
17. As a Rule Author, I want the matching Rule with the highest priority weight to win under `PRIORITY`, so that a critical alert overrides a warning when both conditions hold.

## Implementation Decisions

- **Runtime & Language**: Built in Go (Golang) (ADR-0005).
- **Service Shape**: One service process containing the core and the management layer (ADR-0006). Callers evaluate over HTTP; the core remains an independent Go package so latency is benchmarked in-process. Callers embedding the core are future work.
- **Core Seam**: The core exposes exactly one interface:
  ```go
  type Engine interface {
      Register(def DecisionDefinition) error
      Evaluate(ctx context.Context, decisionID string, version string, facts map[string]any) (*DecisionResult, error)
  }
  ```
- **Execution Model**: Pure in-memory deterministic function `(Facts, Rules) => DecisionResult + EvaluationTrace`. No I/O inside `Evaluate` (ADR-0001).
- **Management Layer**: HTTP API for Drafts, Test Cases, Simulation, Publish and Rollback, persisted in SQLite. On Publish it assigns the next integer version, registers the Decision Version in the core and moves the Latest Pointer atomically (ADR-0006, ADR-0007).
- **CLI**: `bre draft`, `bre simulate`, `bre publish`, `bre rollback`, calling the HTTP API.
- **Rule Representation**: Decision Tables in YAML whose cells are parsed into the JSON AST, plus raw JSON AST for conditions that do not fit a cell (ADR-0002).
- **Registry**: Thread-safe in-memory catalogue of Published Decision Versions indexed by `(decisionID, version)` with a per-Decision Latest Pointer, utilizing read-write synchronization (`sync.RWMutex`) (ADR-0003, ADR-0007).
- **Packaging**: Single self-contained JSON/YAML artifact per Decision Version containing metadata, input schema, hit policy, and rules, used for import/export (ADR-0004).
- **AST Operators**: Supported primitives (`==`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `not_in`), logical operators (`and`, `or`, `not`), and collection iterators (`some`, `all`, `none`).
- **Safe Navigation**: Accessing a nonexistent property in Facts yields `nil`; comparisons against missing properties safely resolve to `false` and append a warning to the evaluation trace.
- **Hit Policies**: `FIRST` (stops on first match), `UNIQUE` (fails if more than one Rule matches), `PRIORITY` (highest integer weight), `COLLECT` (appends all matched rule payloads into a list in Rule order, no aggregation). No match yields an empty Decision Result under every Hit Policy, not an error.
- **Trace Levels**: Trace Summary always; full Evaluation Trace on Caller request and always during Simulation.

## Testing Decisions

- **Public Seam Testing Only**: Core tests exercise only `Engine.Evaluate` and `Engine.Register`; management-layer tests exercise only its HTTP API. Internal AST parsers or registry structures must not be tested through private seams.
- **Pilot Domain Verification Suites** (table-driven, using real artifacts):
  - `calculate-pos-discounts` (`COLLECT`, collection expressions such as `some` item in cart).
  - `classify-customer-tier` (`UNIQUE`, including an overlapping-range violation).
  - `determine-irrigation-action` (`FIRST`, sensor telemetry, drought alerts, rain forecasts).
  - `determine-alert-level` (`PRIORITY`, several alert conditions matching at once).
- **Lifecycle**: Publish refused without passing Test Cases; Stale Draft and Breaking Change warnings; Rollback moves `latest` while the newer version stays evaluable by exact version.
- **Robustness & Concurrency**:
  - `TestEngine_ConcurrentEvaluationAndReload`: Benchmark and race-detector test running concurrent evaluations across multiple goroutines while publishing new versions.
  - `TestEngine_SafeNullNavigation`: Tests asserting missing fact attributes return `false` without panicking.
- **Evaluation (thesis Chapter 5)**: The thesis shows the engine is correct, stable and usable; it does not compare performance against other engines or a hardcoded baseline.
  - Correctness: pass rate of the pilot verification suites (4 Decisions, 2 domains, all 4 Hit Policies).
  - Stability: no data race under concurrent evaluation with hot-reload (race detector); no panic on missing or null Facts.
  - Usability: a scripted policy-change scenario (Draft → Simulation → Publish → Rollback), reporting step count and elapsed time next to the code → build → deploy flow.
  - Latency: < 1ms per evaluation, reported as a pass/fail acceptance threshold only.

## Out of Scope

- Visual Drag-and-Drop Web UI Builder (Phase 2, if time allows).
- Stateful forward/backward inference chaining (Rete algorithm).
- Persistence inside the core (the management layer owns it, ADR-0006); user authentication/authorization.
- Server-side Decision Log of past evaluations; Callers store Trace Summaries.
- Callers embedding the core and pulling Decision Versions from the management layer.
- Complex arithmetic calculations inside rule conditions.

## Further Notes

All architectural decisions are documented in `docs/adr/0001` through `0007`, and the domain glossary is maintained in `CONTEXT.md`.
