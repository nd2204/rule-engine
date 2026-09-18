# Tư liệu nghiên cứu cho Chương 1 — Tổng quan

## 1. Mục đích và ngày truy cập

Tệp này gom nguồn gốc (tài liệu chính thức, mã nguồn, đặc tả, trang nhà xuất bản) để viết Chương 1 theo [DAN-Y.md](../DAN-Y.md): mục 1.1 (luật nghiệp vụ và vấn đề nhúng cứng), 1.2 (Drools, Camunda DMN, GoRules Zen), 1.3 (Bảng 1.1), 1.4 (hướng giải quyết của đồ án). Đây là **ghi chú nghiên cứu**, không phải văn bản chương. Khi đưa vào chương, đổi khoá `[Sx]` thành số `[n]` theo mục 7 của [THESIS_STRUCTURE.md](../THESIS_STRUCTURE.md).

- Ngày truy cập: các nguồn web được truy cập ngày **07/10/2026** hoặc **08/10/2026** (lần truy cập bị gián đoạn do lỗi mạng và được tiếp tục sang ngày hôm sau). Ngày thực tế của từng nguồn ghi trong mục 6.
- Phiên bản tài liệu đã đối chiếu: Drools User Guide **10.2.0** (Apache KIE); Camunda **8.9** (docs.camunda.io) và Camunda **7.24** (docs.camunda.org); GoRules ZEN Engine **2.1.2** (thẻ `zen-engine-v2.1.2`, zen-go `v2.1.2`); OMG DMN **1.6** (bản chính thức mới nhất), 1.7 đang ở dạng beta.
- Mọi đoạn trong ngoặc kép bên dưới là nguyên văn tiếng Anh đã đối chiếu trực tiếp trên nguồn. Phần không có ngoặc kép là tóm tắt của người nghiên cứu.

## 2. Các giải pháp hiện có

### 2.1. Drools (Apache KIE)

**(1) Mô hình thực thi.** Drools dùng thuật toán Phreak, phát triển từ Rete và ReteOO. Phreak đánh giá luật theo kiểu "lười" và hướng mục tiêu, còn Rete thì "háo hức" và hướng dữ liệu [S1].
- Nguyên văn: "*The Drools rule engine in Drools uses the Phreak algorithm for rule evaluation. Phreak evolved from the Rete algorithm, including the enhanced Rete algorithm ReteOO that was introduced in previous versions of Drools for object-oriented systems.*" [S1]
- Nguyên văn: "*While Rete is considered eager (immediate rule evaluation) and data oriented, Phreak is considered lazy (delayed rule evaluation) and goal oriented.*" [S1]
- Các thành phần cơ bản là Rules, Facts, Production memory, Working memory và Agenda. Dữ kiện được chèn vào working memory rồi được so khớp với luật trong production memory [S1].
- Drools có phiên làm việc (KIE session) loại stateless và stateful. Ngoài ra có "*Sequential mode*", trong đó engine "*evaluate rules one time in the order that they are listed in the Drools rule engine agenda without regard to changes in the working memory*" [S1]. Chi tiết này hữu ích khi đối chiếu với cách đánh giá một lượt của đồ án.
- Drools mô tả chính nó là "*a forward-chaining and backward-chaining inference-based rule engine, DMN decisions engine and other projects*" (trang Introduction của bản 8.44 trên docs.drools.org; bản 10.2.0 chưa đối chiếu được câu này) [S6].

**(2) Biểu diễn luật.** Drools hỗ trợ nhiều dạng soạn luật:
- DRL: "*Drools Rule Language (DRL) is a notation established by the Drools open source business automation project for defining and describing business rules. You define DRL rules in .drl text files.*" [S3]
- Bảng quyết định dạng bảng tính: "*Spreadsheet decision tables are XLS or XLSX spreadsheets that contain business rules defined in a tabular format. Each row in a decision table is a rule, and each column is a condition, an action, or another rule attribute.*" Các bảng này được biên dịch thành DRL [S3].
- DMN: "*Drools DMN engine provides runtime support for DMN 1.1, 1.2, 1.3, and 1.4 models at conformance level 3.*" Riêng KIE DMN Editor chỉ hỗ trợ thiết kế mô hình DMN 1.2 [S4]. Biểu thức trong DMN dùng ngôn ngữ FEEL [S4].

**(3) Phiên bản, triển khai, vòng đời.** Dự án KIE là dự án Maven, đóng gói thành KJAR và định danh bằng `ReleaseId` (groupId, artifactId, version) [S2].
- Nguyên văn: "*Since a Kie project is also a Maven project the groupId, artifactId and version declared in the pom.xml file are used to generate a ReleaseId that uniquely identifies this project inside your application.*" [S2]
- KieScanner: "*The KieScanner allows continuous monitoring of your Maven repository to check whether a new release of a Kie project has been installed.*" Khi thấy phiên bản mới, KieScanner "*automatically downloads the new version and triggers an incremental build of the new project*" [S2].
- Giới hạn: "*The KieScanner will only pickup changes to deployed jars if it is using a SNAPSHOT, version range, the LATEST, or the RELEASE setting.*" [S2]
- Nhận xét: tài liệu lõi Drools không mô tả vòng đời bản nháp → mô phỏng → phát hành. Vòng đời ở đây dựa trên Maven và kho artifact. Chưa tìm được tài liệu chính thức nào của Apache KIE về giao diện quản trị luật (công cụ kiểu Business Central cũ) cho bản 10.x, nên không khẳng định gì thêm.

**(4) Giải trình / vết.** Drools cung cấp cơ chế event listener, không có vết giải trình dựng sẵn được trả kèm kết quả:
- Nguyên văn: "*If you register event listeners, the Drools rule engine calls every listener when an activity is performed.*" và "*you can separate logging and auditing work from the core of your application*" [S1].
- Có `AgendaEventListener`, `RuleRuntimeEventListener`, các bản mặc định và các listener gỡ lỗi `DebugAgendaEventListener`, `DebugRuleRuntimeEventListener` [S1].
- Lưu ý hiệu năng: "*The calls block the execution of the Drools rule engine. Therefore, the event listener can affect the performance of the Drools rule engine.*" [S1]
- Với DMN, có thể đăng ký "DMN Runtime Listener" qua thuộc tính `org.kie.dmn.runtime.listeners.$LISTENER_NAME` "*in order to be notified of several events during DMN model evaluations*" [S4].

**(5) Khả năng nhúng, nền tảng, giấy phép.** Drools là thư viện Java, cần JDK 17 trở lên [S5]. Tài liệu nêu hai hướng triển khai: "*using Drools as an embedded Java library or Kogito for cloud-native platform*" [S5]. Mã nguồn tại `apache/incubator-kie-drools`, giấy phép Apache-2.0, ngôn ngữ chính Java [S7].

**(6) Hit policy (trong DMN của Drools).** Trang DMN liệt kê Unique (U), Any (A), Priority (P), First (F) và Collect (C, C+, C<, C>, C#) [S4]. Danh sách này **không** có Rule order và Output order, dù engine tuyên bố đạt mức tuân thủ 3. Cần kiểm tra thêm (xem mục 7).
- Nguyên văn: "*Unique (U): Permits only one rule to match. Any overlap raises an error.*"; "*First (F): Uses the first match in rule order.*"; "*Priority (P): Permits multiple rules to match, with different outputs. The output that comes first in the output values list is selected.*" [S4]

### 2.2. Camunda DMN (Camunda 7 và Camunda 8)

> Bối cảnh quan trọng: kho `camunda/camunda-bpm-platform` đã được lưu trữ (archived). README ghi: "*Camunda 7 Community Edition (CE) is End of Life (EoL), and the Enterprise Edition entered long-term support, receiving only maintenance improvements as well as bug and security fixes.*" [S17]. Chương 1 nên lấy Camunda 8 làm chính và chỉ nhắc Camunda 7 như thế hệ trước có engine DMN nhúng được.

**(1) Mô hình thực thi.** Camunda đánh giá bảng quyết định DMN bằng một engine DMN chuyên dụng. Cả hai thế hệ đều không dùng mạng Rete.
- Camunda 7: "*The Camunda DMN engine is a Java library which can evaluate DMN decision tables. It implements version 1.3 of the OMG DMN standard to the extent documented in the DMN reference.*" [S15]
- Camunda 8: engine DMN là dmn-scala: "*It is integrated into [Camunda 8](https://github.com/camunda/camunda) to evaluate DMN decisions.*" và "*It uses the [FEEL-Scala engine] to evaluate FEEL expressions.*" [S12]. dmn-scala tuyên bố "*Support for the latest version of DMN (Compliance Level 3)*" [S12].
- Trong quy trình BPMN của Camunda 8: "*When the process instance arrives at a business rule task, a decision is evaluated using the internal DMN decision engine.*" Nếu chỉ cần đánh giá quyết định thì dùng API EvaluateDecision [S9].

**(2) Biểu diễn luật.** Luật được biểu diễn bằng DMN XML với biểu thức FEEL. Modeler của Camunda 8 "*offer the same Modeling experience for DMN 1.3 models*" và hỗ trợ "*Decision (tables and literal expressions)*", "*Input data*", "*Knowledge source*", "*Business knowledge model*" [S8]. Hit policy được khai báo qua thuộc tính `hitPolicy` của phần tử XML `decisionTable` [S16], [S18a].

**(3) Phiên bản, triển khai, vòng đời.**
- Camunda 7: "*To evaluate a DMN decision in Camunda 7, it has to be part of a Deployment. After a decision has been deployed, it can be referenced by its key and version.*" Khi triển khai lại một quyết định cùng key, "*the newly deployed decision definition will become a new version of the existing one, increasing its version by one.*" Khi không chỉ định phiên bản, "*the default is to use the latest version of the decision definition*" [S14]. Interface `DecisionDefinition` có `getVersionTag()` với chú thích "*Version tag of the decision definition.*" [S18].
- Camunda 8: thuộc tính `bindingType` quyết định phiên bản được đánh giá: "*latest: The latest deployed version at the moment the business rule task is activated.*"; "*deployment: The version that was deployed together with the currently running version of the process.*"; "*versionTag: The latest deployed version that is annotated with the version tag specified in the versionTag attribute.*" [S9].
- Thẻ phiên bản trong Camunda 8: "*A version tag is different from the numeric process definition version assigned by the Orchestration Cluster.*" và "*you can deploy a new version of a resource with an already existing version tag. In this case, the version tag reference will be updated and point to the latest deployed version.*" [S10]. Có cảnh báo: "*using latest can lead to unexpected behavior if you deploy a new version of the target resource without ensuring backwards compatibility*" [S10].
- Nhận xét để so sánh: trong Camunda, `latest` là phiên bản **mới triển khai gần nhất**. Trong đồ án, `latest` là một **con trỏ tường minh** (ADR-0007), nên *rollback* chỉ cần di chuyển con trỏ. Chưa tìm thấy trong tài liệu Camunda cơ chế "rollback bằng cách lùi latest". Muốn quay lại thì triển khai lại hoặc ghim bằng `versionTag` (suy luận, chưa có câu tài liệu khẳng định trực tiếp).

**(4) Giải trình / vết.**
- Camunda 7: lịch sử `HistoricDecisionInstance` có `getInputs()` và `getOutputs()`. Mỗi đầu ra lưu `getRuleId()` ("*The unique identifier of the rule that is matched.*") và `getRuleOrder()` [S18]. Trang tài liệu "History for DMN Decisions" của bản 7.24 **không truy cập được** (timeout), nên dẫn bằng mã nguồn.
- Camunda 8: API truy vấn decision instance trả về `evaluatedInputs` ("*The evaluated inputs of the decision instance.*") và `matchedRules` ("*The matched rules of the decision instance.*") [S11]. Trang DMN in Modeler còn lưu ý "*Viewing the result of BKM evaluation is currently not supported in Operate.*" [S8].
- Khác biệt với đồ án: ở Camunda, vết là bản ghi lịch sử do nền tảng lưu lại (cần cơ sở dữ liệu hoặc exporter). Ở đồ án, vết đánh giá là dữ liệu trả kèm kết quả quyết định, do lõi thuần sinh ra (ADR-0001).

**(5) Khả năng nhúng, nền tảng, giấy phép.**
- Camunda 7 DMN engine: "*The DMN engine can be used as library embedded in an application or in combination with Camunda 7.*" [S15]. Chạy trên JVM, giấy phép Apache-2.0 [S17].
- Camunda 8: README kho `camunda/camunda`: "*Zeebe, Operate, and Tasklist source files are made available under the Camunda License Version 1.0 except for the parts listed below, which are made available under the Apache License, Version 2.0*" [S13]. Riêng dmn-scala và feel-scala là thư viện Scala/JVM độc lập, giấy phép Apache-2.0, nhúng được qua Maven [S12].

**(6) Hit policy.** Camunda 7 và Camunda 8 hỗ trợ cùng 5 hit policy: UNIQUE, ANY, FIRST, RULE ORDER, COLLECT, cùng các bộ gộp SUM, MIN, MAX, COUNT cho COLLECT [S16], [S18a]. Không có PRIORITY và OUTPUT ORDER.
- Camunda 7: "*The following hit policies are supported by the Camunda DMN engine:*" Unique, Any, First, Rule order, Collect [S16].
- Camunda 8.9: "*If no hit policy is set, then the default hit policy UNIQUE is used.*"; "*The hit policies Unique, Any and First will always return a maximum of one satisfied rule. The hit policies Rule Order and Collect can return multiple satisfied rules.*" [S18a]
- "*If the Collect hit policy is used with an aggregator, the decision table can only have one output.*" [S18a]

### 2.3. GoRules Zen (ZEN Engine)

**(1) Mô hình thực thi.** Zen đánh giá một đồ thị quyết định có hướng (JDM). Dữ liệu đi từ nút Input qua các nút xử lý tới nút Output.
- Nguyên văn: "*The decision graph is GoRules’ visual canvas for modeling business logic.*" và "*Data flows left to right through your graph*" [S22].
- Thứ tự đánh giá do tài liệu mô tả: "*Input data enters through the Input node*", "*Each connected node processes the data in sequence*", "*Results pass through connections to downstream nodes*" và "*If a node has multiple inputs, data from all sources is merged.*" [S22].
- Mã nguồn: `GraphWalker` dùng `petgraph::StableDiGraph` và bắt đầu từ "*all initial nodes (nodes without incoming edges)*" (chú thích trong mã) [S21].
- Từ bản 2.0: "*Pre-compiled engine: decisions are parsed and compiled once at load; evaluation is allocation-light and repeat-safe.*" [S19]
- Không dùng Rete: tài liệu và mã nguồn không đề cập Rete. Kết luận "Zen không dùng Rete" là suy ra từ cấu trúc duyệt đồ thị, không phải câu khẳng định của nhà phát triển.

**(2) Biểu diễn luật.** Luật được lưu ở định dạng JSON (JDM); điều kiện viết bằng ZEN Expression Language.
- Nguyên văn: "*JDM (JSON Decision Model) is the file format used by GoRules to represent decision graphs. It's a human-readable JSON structure that captures nodes, edges, and configuration in a portable format.*" [S24]
- Tệp JDM gồm `nodes` và `edges`. Lợi ích được nêu gồm "*Version controllable*" ("*Store in Git alongside your code*") [S24].
- Các loại nút trong mã nguồn (`DecisionNodeKind`): InputNode, OutputNode, FunctionNode, DecisionNode, DecisionTableNode, ExpressionNode và một số loại khác [S21]. Function node chạy JavaScript tuỳ biến: "*Custom JavaScript logic*" [S22]. Điểm này trái với nguyên tắc "không eval" của đồ án.
- Bản 2.0 bổ sung "*Policy documents*", tức mô hình hoá quyết định dưới dạng văn bản có kiểu dữ liệu, và "*Workspace analysis: static type checking across policies and graphs*" [S19].

**(3) Phiên bản, triển khai, vòng đời.**
- Engine mã nguồn mở không quản lý phiên bản. Việc nạp nội dung do ứng dụng tự lo: "*Loading the JSON is up to you: file system, database or service call.*" [S19]. zen-go có `FilesystemLoader`, `StaticLoader`, `ZipLoader` hoặc callback `zen.Loader` [S20].
- Quản lý vòng đời thuộc về nền tảng thương mại GoRules BRMS: "*A release is a snapshot of a branch at a point in time. Once created, its contents never change - you deploy it to an environment, download it, or return to it later if you need to roll back.*" [S26]. Bản phát hành dùng semantic versioning, có bản nháp ("*A draft is a release without a version number.*"), có kiểm tra pre-flight trên ca kiểm thử trước khi tạo release, và rollback bằng cách triển khai lại release cũ: "*you can re-deploy any earlier release to roll back*" [S26].
- README: "*The engine is open at the core; [GoRules](https://gorules.io) is the platform around it.*" [S19]

**(4) Giải trình / vết.** Zen có tuỳ chọn `trace` khi đánh giá.
- zen-go: `EvaluationOptions{Trace bool; MaxDepth uint8}`; kết quả có trường `Trace *json.RawMessage` và `Performance` [S20].
- Tài liệu Go SDK: "*Enable tracing to inspect decision execution*". Ví dụ mã có chú thích "*Each node's input, output, and performance timing*" [S25].
- Cấu trúc vết trong mã Rust (`DecisionGraphTrace`): `input`, `output`, `name`, `id`, `performance`, `trace_data`, `order` [S21]. Như vậy vết của Zen ghi theo **nút** của đồ thị. Chưa kiểm tra `trace_data` của nút bảng quyết định có ghi luật nào khớp hay không (xem mục 7).

**(5) Khả năng nhúng, nền tảng, giấy phép.** Lõi viết bằng Rust, có binding cho nhiều ngôn ngữ, giấy phép MIT [S19].
- Nguyên văn: "*ZEN Engine is a cross-platform, open-source Business Rules Engine (BRE) written in **Rust**, with native bindings for **Node.js**, **Python**, **Go**, **Java**, **Kotlin** and **.NET**, plus iOS and Android packages.*" [S19] (dấu `**` là định dạng in đậm trong README gốc).
- zen-go gọi lõi Rust qua cgo (`import "C"`, liên kết `-lzen_ffi`) với thư viện dựng sẵn cho linux/darwin/windows amd64/arm64. README ghi "*We do not support linux-musl currently.*" [S20]. Ứng dụng Go nhúng Zen vì vậy phụ thuộc cgo và thư viện native. Đây là một điểm khác với lõi Go thuần của đồ án (ADR-0005).
- README zen-go cũng cho biết dự án hiện không nhận đóng góp mã: "*we can't accept code contributions at this moment, apart from help with documentation and additional tests*" [S20].

**(6) Hit policy.** Bảng quyết định của Zen có hai hit policy là First (mặc định) và Collect, cùng chế độ collect theo từng cột.
- Mã nguồn: `enum DecisionTableHitPolicy { #[default] First, Collect }` [S21].
- Tài liệu: "**First**: *Returns the first matching row (default)*"; "**Collect**: *Returns all matching rows as an array*" [S23].
- Per-column collect: "*End an output field with `[]` to collect that column across every matching row, while the remaining columns follow the first-hit policy.*" [S23]
- Khi không có dòng nào khớp: First trả về `null`, Collect trả về `[]` [S23].
- Lưu ý: nút Switch cũng có hai chế độ "First hit" và "Collect" [S22]. Không nhầm hai chế độ này với hit policy của bảng quyết định.

## 3. Bảng so sánh — nháp cho Bảng 1.1

> **Nháp.** Các ô của ba giải pháp lấy từ mục 2. Cột "Đồ án này" lấy từ CONTEXT.md và ADR-0001…0007. Khi đưa vào chương, rút gọn mỗi ô còn 1–2 dòng và ghi nguồn dưới bảng.

| Tiêu chí | Drools 10.x | Camunda DMN (7.24 / 8.9) | GoRules Zen 2.x | Đồ án này |
|---|---|---|---|---|
| Mô hình thực thi | Phreak (phát triển từ Rete/ReteOO), suy diễn tiến/lùi; có sequential mode [S1] | Engine DMN đánh giá bảng quyết định (C7: Java DMN engine; C8: dmn-scala + FEEL-Scala) [S15], [S12] | Duyệt đồ thị JDM có hướng, từ nút Input qua các nút tới Output; biên dịch trước khi nạp [S22], [S19], [S21] | Đánh giá tuần tự một lượt trên tập luật, không dùng Rete; hàm thuần trong bộ nhớ `(Facts, Rules) => DecisionResult + EvaluationTrace` (ADR-0001) |
| Biểu diễn luật | DRL (.drl), bảng quyết định XLS/XLSX (biên dịch sang DRL), DMN 1.1–1.4 + FEEL [S3], [S4] | DMN XML + FEEL; C8 Modeler hỗ trợ DMN 1.3 [S8], [S14] | JDM (JSON: nodes, edges), ZEN Expression Language; function node chạy JavaScript; policy documents [S24], [S22], [S19] | Bảng quyết định soạn bằng YAML, biên dịch xuống AST JSON; không eval chuỗi (ADR-0002, ADR-0004) |
| Hit policy | U, A, P, F, C (+, <, >, #) theo tài liệu DMN của Drools [S4] | UNIQUE, ANY, FIRST, RULE ORDER, COLLECT (SUM/MIN/MAX/COUNT) [S16], [S18a] | First, Collect, collect theo cột [S21], [S23] | FIRST, UNIQUE, PRIORITY, COLLECT (CONTEXT.md) |
| Quản lý phiên bản / vòng đời | KJAR theo Maven `ReleaseId`; KieScanner tự nạp phiên bản mới (SNAPSHOT/range/LATEST/RELEASE) [S2] | Deployment tạo version tăng dần theo key; `latest` = bản triển khai mới nhất; `versionTag`; C8 có `bindingType` latest/deployment/versionTag [S14], [S9], [S10] | Engine: ứng dụng tự nạp JSON (loader). BRMS thương mại: branch → release (semver, draft, pre-flight test) → deploy; rollback bằng triển khai lại [S19], [S20], [S26] | Bộ đăng ký trong bộ nhớ theo `(decisionId, version)`; con trỏ *latest* tường minh; rollback = lùi con trỏ; bản nháp → mô phỏng (ca kiểm thử bắt buộc đạt) → phát hành, lưu ở SQLite (ADR-0003, ADR-0006, ADR-0007) |
| Vết giải trình | Event listener (Agenda, RuleRuntime, DMN Runtime Listener), do ứng dụng tự ghi; listener chặn luồng thực thi [S1], [S4] | Lịch sử decision instance: input, output, luật khớp (ruleId, ruleOrder); C8 có `evaluatedInputs`, `matchedRules` qua API [S18], [S11] | Tuỳ chọn `trace`: đầu vào, đầu ra, thời gian của từng nút [S20], [S25], [S21] | Vết đánh giá: snapshot dữ kiện, kết quả từng điều kiện, luật khớp và lý do chọn/loại theo hit policy, phiên bản; trace summary luôn có (CONTEXT.md) |
| Khả năng nhúng / nền tảng | Thư viện Java, JDK 17+ [S5] | C7 DMN engine: thư viện Java nhúng được [S15]; C8: nền tảng Zeebe (dịch vụ), dmn-scala nhúng được trên JVM [S12] | Lõi Rust; binding Node.js, Python, Go (cgo), Java, Kotlin, .NET, iOS, Android [S19], [S20] | Thư viện Go thuần (không cgo), dùng qua dịch vụ HTTP/CLI (ADR-0005, ADR-0006) |
| Giấy phép | Apache-2.0 [S7] | C7: Apache-2.0 (CE đã EoL) [S17]; C8: Camunda License 1.0 cho Zeebe/Operate/Tasklist, Apache-2.0 cho một số phần [S13] | Engine: MIT; BRMS là sản phẩm thương mại [S19] | Apache-2.0 (tác giả chọn) |

## 4. Nguồn về BRMS và vấn đề nhúng cứng luật nghiệp vụ (dùng cho mục 1.1)

**Business Rules Manifesto (Business Rules Group, v2.0, 2003, biên tập: Ronald G. Ross)** [S29]. Đây là nguồn chính, truy cập được và có quyền tái bản nếu giữ nguyên văn. Các điều khoản dùng được (nguyên văn):
- 2.2: "*Rules are not process and not procedure. They should not be contained in either of these.*" Dùng cho luận điểm tách luật khỏi mã quy trình.
- 6.1: "*A business rules application is intentionally built to accommodate continuous change in business rules. The platform on which the application runs should support such continuous change.*"
- 6.2: "*Executing rules directly — for example in a rules engine — is a better implementation strategy than transcribing the rules into some procedural form.*" Đây là câu trực tiếp nhất về vấn đề nhúng cứng.
- 6.3: "*A business rule system must always be able to explain the reasoning by which it arrives at conclusions or takes action.*" Câu này làm cơ sở cho vết đánh giá.
- 9.2: "*Business people should have tools available to help them formulate, validate, and manage rules.*" Câu này làm cơ sở cho mô phỏng và ca kiểm thử.
- 10.4: "*Rules, and the ability to change them effectively, are fundamental to improving business adaptability.*"
- Chú thích nguồn trên trang: "*Version 2.0, November 1, 2003. Edited by Ronald G. Ross.*" Trích phải ghi công Business Rules Group và giữ nguyên nội dung.

**Martin Fowler, "RulesEngine" (bliki, 07/01/2009)** [S30]. Đây là góc nhìn phản biện, cần cho cân bằng ở mục 1.1 và 1.4:
- Định nghĩa: "*A rules engine is all about providing an alternative computational model.*" Rules engine dựa trên "*Production Rule System*", với các luật gồm điều kiện và hành động.
- Rủi ro của chaining: "*Chaining sounds appealing, since it supports more complex behaviors, but can easily end up being very hard to reason about and debug.*" Câu này ủng hộ lựa chọn đánh giá một lượt, không chaining, không Rete của đồ án.
- Nghi ngờ "người nghiệp vụ tự viết luật": "*Often the central pitch for a rules engine is that it will allow the business people to specify the rules themselves, so they can build the rules without involving programmers. As so often, this can sound plausible but rarely works out in practice.*"
- Kiểm thử: "*implicit behavior makes testing more important*". Câu này ủng hộ việc bắt buộc ca kiểm thử trước khi phát hành.
- Gợi ý engine hẹp theo miền: "*This would argue for a more domain specific approach to rules, where a team builds a limited rules engine that's only designed to work within that narrow context.*" Có thể dùng để biện minh cho phạm vi của đồ án.
- Tự làm engine đơn giản: "*You can build a simple rules engine yourself. All you need is to create a bunch of objects with conditions and actions, store them in a collection, and run through them to evaluate the conditions and execute the actions.*"
- Rete: "*More efficient execution engines help to quickly evaluate conditions on hundreds of rules using specialized algorithms (such as the Rete algorithm).*"

**OMG DMN 1.6 (formal/25-12-02)** [S27], [S28]. Bản chính thức mới nhất là 1.6 (ngày thông qua trên trang OMG: "September 2026"); 1.7 đang beta. Các bản trước: 1.5 (August 2024), 1.4 (April 2023), 1.3 (February 2021).
- Mục 1 Scope, tr. 1: "*The primary goal of DMN is to provide a common notation that is readily understandable by all business users, from the business analysts needing to create initial decision requirements and then more detailed decision models, to the technical developers responsible for automating the decisions in processes, and finally, to the businesspeople who will manage and monitor those decisions.*"
- Mục 1, tr. 1: "*DMN creates a standardized bridge for the gap between the business decision design and decision implementation.*"
- Mục 8.2.11, tr. 74: "*Tools may support only a nonempty subset of hit policies, but the table type SHALL be clear and therefore the hit policy indication is mandatory, except for the default unique tables. Unique tables SHALL always be supported.*" Câu này là cơ sở chuẩn để đồ án chọn 4/7 hit policy (mục 2.2.3).
- Mục 8.2.11, tr. 74: bảy hit policy là Unique, Any, Priority, First (single hit) và Output order, Rule order, Collect (multiple hit). Nguyên văn về First: "*first hit tables are not considered good practice because they do not offer a clear overview of the decision logic.*"
- Mục 8.2.11.1, tr. 74, định nghĩa Priority: "*This policy returns the matching rule with the highest output priority. Output priorities are specified in the ordered list of output values, in decreasing order of priority. Note that priorities are independent from rule sequence.*" Lưu ý: PRIORITY của đồ án dùng **trọng số ưu tiên của luật** (CONTEXT.md), khác PRIORITY của DMN vốn dựa trên thứ tự giá trị đầu ra. Chương 2 cần nói rõ khác biệt này.

**Sách (chỉ xác minh được qua trang nhà xuất bản, chưa đọc nội dung):**
- Ronald G. Ross (2003), *Principles of the Business Rule Approach*, Addison-Wesley Professional, thuộc Addison-Wesley Information Technology Series. ISBN-13 978-0-201-78893-8, 1st ed. Trang InformIT ghi "Published Feb 5, 2003", "Copyright 2003" [S31]. Phần trích lời tựa trên InformIT có câu: "*There are several terms in current usage for such a service, including rule engine and decision-management platform.*" Mục lục có chương "*Expressing Business Logic by Using Decision Tables: The RuleSpeak Approach*". **Nơi xuất bản (Boston) chưa xác minh** từ trang nhà xuất bản.
- Barbara von Halle (2001), *Business Rules Applied: Building Better Systems Using the Business Rules Approach*, Wiley. ISBN 978-0-471-41293-9, 592 trang, trang Wiley ghi "October 2001" [S32]. Mô tả của nhà xuất bản (không phải lời tác giả): "*A rules-extended development approach does exactly the same thing for business rules: by reducing the amount of code that needs to be written, it shortens the time necessary to implement change.*" **Nơi xuất bản (New York) chưa xác minh.**
- James Taylor, Neil Raden (2007), *Smart Enough Systems: How to Deliver Competitive Advantage by Automating Hidden Decisions*. Trang InformIT ghi "Published Jun 29, 2007 by Pearson", "Copyright 2007", 1st ed. Trang này là của **bản eBook**, ISBN-13 978-0-13-279963-8 [S33]. Mục lục có "The Smart Enough Systems Manifesto" (tr. 5), "Chapter 6 Business Rules" (tr. 177), "Chapter 2 Enterprise Decision Management" (tr. 39); lời tựa của Barbara von Halle. **Nhà in Prentice Hall, nơi xuất bản Upper Saddle River (NJ) và ISBN bản in 0-13-234796-2 chỉ thấy ở nguồn thứ cấp (nhà sách), chưa xác minh trên trang nhà xuất bản.**

**Gợi ý dùng cho mục 1.1:** mở bằng thực trạng trong nước theo BRD 04 (luật nằm trong câu lệnh điều kiện, sửa phải qua dev → kiểm thử → phát hành, không có trace thống nhất). Sau đó dẫn Manifesto 2.2/6.2 cho nguyên tắc tách luật, 6.3 cho yêu cầu giải trình, và DMN Scope cho chuẩn hoá. Kết bằng phản biện của Fowler để dẫn sang 1.4: engine hẹp, không chaining, bắt buộc kiểm thử.

## 5. Nguồn tiếng Việt

**Không tìm thấy** luận văn, đồ án hay bài báo khoa học tiếng Việt về rule engine/BRMS có thể xác minh và trích dẫn. Đã tìm với các từ khoá "luật nghiệp vụ" + "rule engine"/"Drools", "hệ thống quản lý luật nghiệp vụ BRMS luận văn", và "rule engine" "luật" giới hạn `site:edu.vn`. Kết quả chỉ ra tài liệu tiếng Anh, cùng trang Microsoft Learn bản `vi-vn` về BizTalk Rule Engine (https://learn.microsoft.com/vi-vn/biztalk/core/rule-engine). Trang này là tài liệu sản phẩm, chưa mở để kiểm tra có bản dịch tiếng Việt thật hay không, và không nên dùng làm nguồn học thuật. Thực trạng trong nước ở mục 1.1 hiện chỉ dựa được vào BRD nội bộ (`docs/brd/04-current-state.md`). Nếu xếp tài liệu này vào nhóm 6 ("Tài liệu gốc của cơ quan thực tập") thì cần tác giả xác nhận BRD có nguồn gốc từ đơn vị thực tập.

## 6. Danh sách nguồn

Định dạng theo mục 7 của THESIS_STRUCTURE.md, xếp theo thứ tự nhóm. Chưa đánh số `[n]`.

### Nhóm 3 — Sách tiếng nước ngoài

- [S31]. Ross, R. G. (2003), *Principles of the Business Rule Approach*. Addison-Wesley Professional, Boston. — *nơi xb chưa xác minh; trang NXB: https://www.informit.com/store/principles-of-the-business-rule-approach-9780201788938 (truy cập 08/10/2026)*
- [S32]. von Halle, B. (2001), *Business Rules Applied: Building Better Systems Using the Business Rules Approach*. John Wiley & Sons, New York. — *nơi xb chưa xác minh; trang NXB: https://www.wiley.com/en-us/Business+Rules+Applied%3A+Building+Better+Systems+Using+the+Business+Rules+Approach-p-9780471412939 (truy cập 08/10/2026)*
- [S33]. Taylor, J., Raden, N. (2007), *Smart Enough Systems: How to Deliver Competitive Advantage by Automating Hidden Decisions*. Prentice Hall, Upper Saddle River. — *NXB/nơi xb bản in chưa xác minh; InformIT chỉ ghi "Pearson" cho bản eBook: https://www.informit.com/store/smart-enough-systems-how-to-deliver-competitive-advantage-9780132799638 (truy cập 08/10/2026)*

### Nhóm 5 — Các trang web

Drools / Apache KIE:
- [S1]. Apache KIE (2026), *Drools rule engine — Drools User Guide 10.2.0 [online]*, 07/10/2026, from: https://kie.apache.org/docs/10.2.x/drools/drools/rule-engine/index.html.
- [S2]. Apache KIE (2026), *Build, Deploy, Utilize and Run — Drools User Guide 10.2.0 [online]*, 07/10/2026, from: https://kie.apache.org/docs/10.2.x/drools/drools/KIE/index.html.
- [S3]. Apache KIE (2026), *Rule Language Reference — Drools User Guide 10.2.0 [online]*, 07/10/2026, from: https://kie.apache.org/docs/10.2.x/drools/drools/language-reference/index.html.
- [S4]. Apache KIE (2026), *Decision Model and Notation (DMN) — Drools User Guide 10.2.0 [online]*, 07/10/2026, from: https://kie.apache.org/docs/10.2.x/drools/drools/DMN/index.html.
- [S5]. Apache KIE (2026), *Getting Started — Drools User Guide 10.2.0 [online]*, 07/10/2026, from: https://kie.apache.org/docs/10.2.x/drools/drools/getting-started/index.html.
- [S6]. Drools (2023), *Introduction — Drools User Guide 8.44.0.Final [online]*, 07/10/2026, from: https://docs.drools.org/latest/drools-docs/drools/introduction/index.html. — *năm ước lượng theo bản 8.44; chỉ dùng nếu cần câu định nghĩa "forward-chaining and backward-chaining"*
- [S7]. Apache Software Foundation (2026), *apache/incubator-kie-drools — GitHub repository [online]*, 07/10/2026, from: https://github.com/apache/incubator-kie-drools.

Camunda:
- [S8]. Camunda (2026), *DMN in Modeler — Camunda 8.9 Docs [online]*, 07/10/2026, from: https://docs.camunda.io/docs/components/modeler/dmn/.
- [S9]. Camunda (2026), *Business rule tasks — Camunda 8.9 Docs [online]*, 08/10/2026, from: https://docs.camunda.io/docs/components/modeler/bpmn/business-rule-tasks/.
- [S10]. Camunda (2026), *Choosing the resource binding type — Camunda 8.9 Docs [online]*, 07/10/2026, from: https://docs.camunda.io/docs/components/best-practices/modeling/choosing-the-resource-binding-type/.
- [S11]. Camunda (2026), *Type Alias: DecisionInstanceGetQueryResult — Camunda 8.9 TypeScript SDK API Reference [online]*, 08/10/2026, from: https://docs.camunda.io/docs/apis-tools/typescript/api-reference/index/type-aliases/DecisionInstanceGetQueryResult/.
- [S12]. Camunda (2026), *camunda/dmn-scala — DMN engine written in Scala, GitHub repository [online]*, 08/10/2026, from: https://github.com/camunda/dmn-scala.
- [S13]. Camunda (2026), *camunda/camunda — README, mục License, GitHub repository [online]*, 07/10/2026, from: https://github.com/camunda/camunda.
- [S14]. Camunda (2025), *Decisions in the Process Engine Repository — Camunda 7.24 Docs [online]*, 07/10/2026, from: https://docs.camunda.org/manual/latest/user-guide/process-engine/decisions/repository/.
- [S15]. Camunda (2025), *DMN Engine — Camunda 7.24 Docs [online]*, 08/10/2026, from: https://docs.camunda.org/manual/latest/user-guide/dmn-engine/.
- [S16]. Camunda (2025), *DMN Hit Policy — Camunda 7.24 Docs [online]*, 08/10/2026, from: https://docs.camunda.org/manual/latest/reference/dmn/decision-table/hit-policy/.
- [S17]. Camunda (2025), *camunda/camunda-bpm-platform — README, GitHub repository (archived) [online]*, 07/10/2026, from: https://github.com/camunda/camunda-bpm-platform.
- [S18]. Camunda (2025), *HistoricDecisionInstance.java, HistoricDecisionOutputInstance.java, DecisionDefinition.java — camunda-bpm-platform source [online]*, 08/10/2026, from: https://github.com/camunda/camunda-bpm-platform/tree/master/engine/src/main/java/org/camunda/bpm/engine.
- [S18a]. Camunda (2026), *Hit policy — Camunda 8.9 Docs [online]*, 07/10/2026, from: https://docs.camunda.io/docs/components/modeler/dmn/decision-table-hit-policy/.

GoRules:
- [S19]. GoRules (2026), *gorules/zen — ZEN Engine README (v2.x), GitHub repository [online]*, 08/10/2026, from: https://github.com/gorules/zen.
- [S20]. GoRules (2026), *gorules/zen-go — Go Rules Engine, README và mã nguồn v2.1.2 (zen.go, cgo.go) [online]*, 08/10/2026, from: https://github.com/gorules/zen-go.
- [S21]. GoRules (2026), *ZEN Engine source code, tag zen-engine-v2.1.2 (core/types/src/decision/mod.rs; core/engine/src/decision_graph/walker.rs, tracer.rs) [online]*, 08/10/2026, from: https://github.com/gorules/zen/tree/zen-engine-v2.1.2/core.
- [S22]. GoRules (2026), *Understanding the decision graph [online]*, 08/10/2026, from: https://docs.gorules.io/learn/authoring/decision-graphs.
- [S23]. GoRules (2026), *Building decision tables [online]*, 08/10/2026, from: https://docs.gorules.io/learn/authoring/decision-tables.
- [S24]. GoRules (2026), *JDM Standard [online]*, 08/10/2026, from: https://docs.gorules.io/developers/jdm/standard.
- [S25]. GoRules (2026), *Go Rules Engine (Go SDK) [online]*, 08/10/2026, from: https://docs.gorules.io/developers/sdks/go.
- [S26]. GoRules (2026), *Releases [online]*, 08/10/2026, from: https://docs.gorules.io/brms/deploy/releases.

Chuẩn, tuyên ngôn, bài viết:
- [S27]. Object Management Group (2026), *Decision Model and Notation (DMN), Version 1.6, formal/25-12-02 [online]*, 08/10/2026, from: https://www.omg.org/spec/DMN/1.6/PDF. — *có thể chuyển sang mẫu "Sách điện tử" nếu GVHD yêu cầu; số trang ghi theo số in trên trang (tr. 1, tr. 74–75)*
- [S28]. Object Management Group (2026), *About the Decision Model and Notation Specification [online]*, 08/10/2026, from: https://www.omg.org/spec/DMN/.
- [S29]. Business Rules Group (2003), *The Business Rules Manifesto, Version 2.0 [online]*, 08/10/2026, from: https://www.businessrulesgroup.org/brmanifesto.htm.
- [S30]. Fowler, M. (2009), *RulesEngine [online]*, 08/10/2026, from: https://martinfowler.com/bliki/RulesEngine.html.

## 7. Vấn đề mở và thông tin chưa xác minh

1. **Ngày truy cập**: đề bài yêu cầu ghi 07/10/2026, nhưng một phần nguồn chỉ truy cập được ngày 08/10/2026 do lỗi mạng. Mục 6 ghi ngày thực tế. Nếu muốn thống nhất một ngày thì phải truy cập lại toàn bộ.
2. **Hit policy trong Drools DMN**: trang DMN của Drools 10.2.0 chỉ liệt kê U, A, P, F, C, không có Rule order và Output order, dù engine tuyên bố đạt mức tuân thủ 3. Chưa kiểm tra mã nguồn `kie-dmn-core` (enum `HitPolicy`). Trong Bảng 1.1 nên ghi "theo tài liệu".
3. **Trang "History for DMN Decisions" của Camunda 7.24** bị timeout, nên đã dẫn bằng mã nguồn Java [S18]. Trang "Embed" của DMN engine Camunda 7 cũng không tải được; câu "embedded in an application" lấy từ trang tổng quan [S15].
4. **Camunda 8 API decision instance**: schema REST (`get-decision-instance`) render bằng JavaScript nên không trích được. Đã dùng trang kiểu TypeScript SDK [S11] thay thế. Chưa xác minh trường `matchedRules` có kèm danh sách đầu ra theo luật hay không.
5. **Camunda 8 không có PRIORITY/OUTPUT ORDER**: kết luận dựa vào việc trang hit policy chỉ liệt kê 5 policy [S18a]. Tài liệu không có câu "not supported" tường minh.
6. **Rollback trong Camunda**: chưa tìm thấy tài liệu chính thức mô tả thao tác rollback quyết định. Nhận xét "phải triển khai lại hoặc ghim versionTag" là suy luận.
7. **GoRules Zen**: chưa xác minh `trace_data` của nút bảng quyết định có chứa chỉ số/ID dòng khớp. Chưa đọc giấy phép và điều khoản của GoRules BRMS (bản self-hosted). "BRMS là sản phẩm thương mại" chỉ dựa vào câu README "*The engine is open at the core; GoRules is the platform around it.*".
8. **Drools — công cụ quản trị luật**: chưa tìm được tài liệu Apache KIE 10.x về công cụ soạn/duyệt luật kiểu Business Central. Không khẳng định có hay không.
9. **Năm của tài liệu web tổ chức** (Apache KIE, Camunda, GoRules) là năm ước lượng theo phiên bản tài liệu hoặc lần cập nhật gần nhất. Các trang không ghi ngày xuất bản rõ ràng.
10. **OMG DMN 1.6**: trang OMG ghi "Publication Date: September 2026", còn bìa PDF ghi "Release Date: tbd" và số tài liệu formal/25-12-02. Đã chọn năm 2026 theo trang OMG.
11. **Sách**: nơi xuất bản của cả ba cuốn và thông tin bản in của *Smart Enough Systems* (Prentice Hall, ISBN 0-13-234796-2) chưa xác minh từ trang nhà xuất bản. Chưa đọc nội dung sách, nên **không** trích nguyên văn từ sách ngoài các đoạn đã hiện trên trang nhà xuất bản.
12. **Giấy phép của đồ án**: đã chốt Apache-2.0.
13. **Khác biệt ngữ nghĩa PRIORITY**: PRIORITY của đồ án dùng trọng số luật, còn PRIORITY của DMN dùng thứ tự giá trị đầu ra (DMN 1.6, tr. 74). Cần nêu ở mục 2.2.3 để tránh bị phản biện là "không đúng chuẩn".
