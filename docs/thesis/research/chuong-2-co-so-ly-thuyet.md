# Tư liệu nghiên cứu cho Chương 2 — Cơ sở lý thuyết

## 1. Mục đích, ngày truy cập, phiên bản tài liệu

Tệp này gom nguồn gốc (đặc tả, tài liệu chính thức, bài báo gốc, trang nhà xuất bản) để viết Chương 2 theo [DAN-Y.md](../DAN-Y.md), các mục 2.1–2.7. Đây là **ghi chú nghiên cứu**, không phải văn bản chương. Khoá nguồn mới dùng tiền tố `[Tx]` để không trùng với `[Sx]` của [chuong-1-tong-quan.md](chuong-1-tong-quan.md). Khi đưa vào chương, đổi khoá thành số `[n]` theo mục 7 của [THESIS_STRUCTURE.md](../THESIS_STRUCTURE.md).

- **Ngày truy cập**: mọi nguồn web trong tệp này được truy cập ngày **08/10/2026**.
- **Nguồn dùng lại từ Chương 1** (không xác minh lại):
  - [S29] Business Rules Manifesto v2.0 (= [1] trong `91-tai-lieu-tham-khao.md`)
  - [S27] OMG DMN 1.6 (= [2]). Lần này đã tải lại PDF để đọc thêm các mục 2, 6, 8, 9, 10, 11.
  - [S30] Fowler, *RulesEngine* (= [3])
  - [S1] Drools rule engine 10.2.0 (= [4]). Đã đối chiếu lại nguyên văn các câu về chaining và sequential mode.
- **Phiên bản tài liệu đã đối chiếu**:
  - OMG DMN **1.6** (formal/25-12-02)
  - OMG SBVR **1.5** (formal/2019-10-02, phát hành 12/2019)
  - OMG PRR **1.0** (formal/2009-12-01, 12/2009)
  - OMG UML **2.5.1** (formal/2017-12-05, 12/2017). Trang OMG ghi đây là bản mới nhất.
  - Go: đặc tả ngôn ngữ "*Language version go1.27 (May 26, 2026)*"; tài liệu gói trên pkg.go.dev ở phiên bản **go1.27.1** ("Published: Sep 1, 2026"); Go Memory Model "*Version of June 6, 2022*".
  - CWE **4.20** (trang ghi "Page Last Updated: April 30, 2026")
  - Semantic Versioning **2.0.0**
  - C4-PlantUML bản phát hành mới nhất **v2.14.0** (26/08/2026). PlantUML cài trên máy tác giả là **1.2026.6**, đóng gói sẵn stdlib C4 bản **2.13.0** (theo `plantuml -stdlib`).
- **Quy ước trích dẫn**:
  - Mọi đoạn trong ngoặc kép in nghiêng là nguyên văn tiếng Anh, đã đối chiếu trực tiếp trên nguồn (HTML hoặc văn bản trích từ PDF).
  - Với PDF, số trang là **số in trên trang**, không phải số trang của tệp PDF.
  - Một vài chỗ chữ bị tách sai khi trích văn bản từ PDF (ví dụ "sp ecified", "co ndition") đã được nối lại. Chỉ số chú thích chân trang nằm trong câu đã được bỏ đi.
  - Phần không có ngoặc kép là tóm tắt của người nghiên cứu.

---

## 2. Kết quả theo từng mục

### 2.1. Luật nghiệp vụ và hệ quản trị luật nghiệp vụ (BRMS)

**(1) Định nghĩa gốc của Business Rules Group (báo cáo GUIDE)** [T1]

Tài liệu: *Defining Business Rules ~ What Are They Really?*, Business Rules Group. Bìa ghi "*formerly, known as the GUIDE Business Rules Project*", "*Final Report revision 1.3, July, 2000*". Người soạn là David Hay và Keri Anderson Healy; quản lý dự án là Allan Kolber. Nhóm dự án có Ronald Ross, Barbara von Halle, John Zachman, E.F. Codd và những người khác (tr. ii).

- Định nghĩa (mục "Definition of a Business Rule", tr. 4–5): "*A business rule is a statement that defines or constrains some aspect of the business. It is intended to assert business structure or to control or influence the behavior of the business.*" Câu này bị ngắt qua trang 4 và 5 của bản PDF.
- Tính nguyên tử (tr. 5): "*The business rules which concern the project are atomic ~ that is, they cannot be broken down further.*"
- Bốn loại luật (mục "Categories of Business Rule", tr. 6): "*A statement of a business rule falls into one of four categories:*" gồm "*Definitions of business terms*", "*Facts relating terms to each other*", "*Constraints (here called 'action assertions')*" và "*Derivations*".
  - Hai loại đầu được gộp thành "Structural Assertions" (Chương 4 của báo cáo).
  - Về derivations: "*Business rules (including laws of nature) define how knowledge in one form may be transformed into other knowledge, possibly in a different form.*" (tr. 6)
- Định nghĩa trong bảng thuật ngữ:
  - Structural Assertion (Phụ lục E, tr. E.5): "*a statement that something of importance to the business either exists as a concept of interest or exists in relationship to another thing of interest.*"
  - Action Assertion (tr. 30): "*a statement that concerns some dynamic aspect of the business. It specifies constraints on the results that actions can produce.*"
  - Derivation (tr. 33): "*an algorithm used to compute or infer a DERIVED FACT.*"
  - Derived Fact (tr. 33): "*a FACT whose value is created by an inference or a mathematical calculation from TERMs, FACTs, other DERIVATIONs, or ACTION ASSERTIONs.*"
- Tính khai báo (tr. 8): "*Note that a business rule is declarative, not procedural. It describes a desirable, possible state that is either suggested, required or prohibited. It may be conditional ~ that is, if something is the case, something else must or must not be the case. It does not, however, describe the steps to be taken to achieve the transition from one state to another, or the steps to be taken to prohibit a transition.*"

**(2) Định nghĩa trong đặc tả OMG SBVR 1.5** [T2]

- Mục 16.1.2 "Business Rules and Advices", tr. 98. Mục từ "business rule": "*Definition: rule that is practicable and that is under business jurisdiction*".
- Ghi chú cùng mục, tr. 98: "*A rule's being under business jurisdiction means that it is under the jurisdiction of an authority that can opt to change or discard the rule at its own discretion.*"
- Phân loại theo SBVR:
  - Mục 17.1.2 "Definitional Rules", tr. 109: "definitional rule" — "*Definition: rule that necessitates a given state of affairs*", "*Synonym: structural rule*".
  - Mục 18.1.2 "Behavioral Rules", tr. 117: "behavioral business rule" — "*Definition: business rule that obligates a given state of affairs*".

**(3) Đặc tả OMG Production Rule Representation (PRR) 1.0** [T3]. Đây là chuẩn OMG cho luật sản xuất (production rule), loại luật mà rule engine thực thi.

- Mục 7.2.1, tr. 6: "*A production rule is a statement of programming logic that specifies the execution of one or more actions in the case that its conditions are satisfied. Production rules therefore have an operational semantic (formalizing state changes, e.g., on the basis of a state transition system formalism).*"
- Dạng biểu diễn (tr. 6): "*if [condition] then [action-list]*"
- Mục 7.2.2, tr. 7, về tập luật: "*The container for production rules is the production ruleset.*" Tập luật cung cấp "*A runtime unit of execution in a rule engine together with the interface for rule invocation.*"
- Mục 1/7.1, tr. 5, các hướng mở rộng tương lai có "*Rule representations that are specific to graphical notations, such as decision tables and decision trees.*" Nghĩa là PRR 1.0 không chuẩn hoá bảng quyết định; phần này thuộc về DMN.

**(4) BRMS — vai trò hệ quản trị**. **Chưa tìm thấy** định nghĩa BRMS trong một đặc tả chuẩn (OMG, ISO).
- Nguồn tiếp cận được là mô tả của nhà cung cấp, trong một IBM Redpaper (Crowther, Kohli, Buecker, 06/06/2013, REDP-4997-00) [T4]: "*IBM® Operational Decision Manager (ODM) is an implementation of a Business Rule Management System (BRMS). It enables you to create, manage, test, and govern business rules and events. You can store these in a central repository where multiple individuals and software products can access them.*"
- Nguồn này chỉ nên dùng để minh hoạ các chức năng điển hình của một BRMS: soạn, quản lý, kiểm thử, quản trị và kho tập trung. Không dùng làm định nghĩa học thuật.
- Có thể kết hợp với Manifesto [S29] (= [1]) như đã dùng ở Chương 1:
  - 6.1: nền tảng phải hỗ trợ thay đổi liên tục
  - 6.2: thực thi luật trực tiếp trong rules engine
  - 6.3: giải trình
  - 9.2: công cụ để "*formulate, validate, and manage rules*"

**Gợi ý dùng cho mục 2.1**
- Mở mục bằng định nghĩa của BRG [T1, tr. 4–5]. Đây là định nghĩa gốc, được trích nhiều nhất. Sau đó đặt cạnh định nghĩa SBVR [T2, tr. 98] để cho thấy định nghĩa đã được chuẩn hoá ở OMG.
- Ánh xạ phân loại của BRG sang hệ thống:
  - **Derivation**: một *luật* trong bảng quyết định suy ra *kết quả đầu ra* từ dữ kiện. Đây là loại chính mà đồ án hiện thực.
  - **Action assertion** (ràng buộc): tương ứng một phần với kiểm tra lược đồ đầu vào.
  - **Structural assertion**: tương ứng với lược đồ dữ kiện (input schema).
- Câu "*declarative, not procedural*" [T1, tr. 8] là cơ sở để biểu diễn luật dưới dạng dữ liệu (bảng quyết định → AST), không phải mã thủ tục.
- PRR [T3] cho định nghĩa production rule "if…then" và khái niệm *ruleset* là "đơn vị thực thi". Hai khái niệm này tương ứng với *luật* và *tập luật* (Rule Set) trong CONTEXT.md.
- Với BRMS: nêu các chức năng "create, manage, test, and govern" [T4] và đối chiếu với lớp quản trị vòng đời của đồ án (bản nháp → mô phỏng → phát hành). Nói rõ đó là mô tả của nhà cung cấp.

---

### 2.2. Chuẩn DMN (OMG DMN 1.6 — [S27], đã có, = [2] trong 91-tai-lieu-tham-khao.md)

Bìa PDF ghi "*Version 1.6*", "*OMG Document Number: formal/25-12-02*". Số trang dưới đây là số in trên trang.

#### 2.2.1. Mô hình quyết định (DRG/DRD)

- Mục 6.1, tr. 21: "*The decision requirements level of a decision model in DMN consists of a Decision Requirements Graph (DRG) depicted in one or more Decision Requirements Diagrams (DRDs).*"
- Mục 6.1, tr. 21: "*A DRG models a domain of decision-making, showing the most important elements involved in it and the dependencies between them.*"
- Các phần tử (mục 6.1, tr. 21):
  - "*A Decision element denotes the act of determining an output from a number of inputs, using decision logic which may reference one or more Business Knowledge Models.*"
  - "*An Input Data element denotes information used as an input by one or more Decisions.*"
  - "*A Business Knowledge Model element denotes a function encapsulating business knowledge, e.g., as business rules, a decision table, or an analytic model.*"
  - "*A Knowledge Source element denotes an authority for a Business Knowledge Model or Decision.*"
  - "*A Decision Service element denotes a set of reusable decisions that can be invoked internally or externally.*"
- Ba loại yêu cầu (tr. 21): information, knowledge và authority. Ví dụ: "*An Information Requirement denotes Input Data or Decision output being used as input to a Decision.*"
- Phân biệt DRG và DRD (tr. 21): "*It is important to distinguish this complete definition of the DRG from a DRD presenting any particular view of it, which may be a partial or filtered display*".

#### 2.2.2. Bảng quyết định

- Mục 8.1, tr. 65: "*A decision table is a tabular representation of a set of related input and output expressions, organized into rules indicating which output entry applies to a specific set of input entries.*"
- Tr. 65: "*The decision table contains all (and only) the inputs required to determine the output. Moreover, a complete table contains all possible combinations of input values (all the rules).*"
- Thành phần (tr. 65):
  - "*A list of input clauses (zero or more)*", mỗi input clause gồm "*an input expression and optional allowed values*"
  - "*A list of output clauses (one or more)*"
  - "*A list of annotation clauses (zero or more)*"
  - "*A list of rules (one or more) in rows or columns of the table (depending on orientation), where each rule is composed of the specific input entries, output entries and optional rule annotations of the table row (or column).*"
- Cách đọc một luật (tr. 67): "*If the value of input expression 1 satisfies input entry a and the value of input expression 2 satisfies input entry b then the rule matches and the result of the decision table is output entry c.*"
- Ô "-" (tr. 67): "*If the input entry is '-' (meaning irrelevant), every value of the input expression satisfies the input entry, and that particular input is irrelevant in the specified rule.*"
- Tr. 67: "*A rule matches if the value of every input expression satisfies the corresponding input entry. If there are no input entries, any rule matches.*"
- Luật chồng lấn (tr. 68): "*If rules overlap, multiple rules can match, and a hit policy indicates how to handle the multiple matches.*"
- Mục 8.2.8 Input entries, tr. 72: "*Rule input entries are unary tests (grammar rule 15).*"
- Không có tác dụng phụ (mục 8.2.8, tr. 72): "*Evaluation of the input expressions in a decision table does not produce side-effects that influence the evaluation of other input expressions. This means that evaluating an expression or executing a rule should not change the evaluation of other expressions or rules of the same table.*"
- Mô hình lớp `DecisionRule` (mục 8.3.3, tr. 79): "*An instance of DecisionRule has an ordered list of inputEntry instances which are instances of UnaryTests, an ordered list of outputEntry instances, which are instances of LiteralExpression, and an ordered list of ruleAnnotations.*" và "*The inputEntrys are matched in arbitrary order.*"
- Ngữ nghĩa khi gọi bảng quyết định (mục 10.3.2.10, tr. 120–121):
  - "*Every rule in the rule list is matched with the input expression list. Matching is unordered.*"
  - Khi không có luật nào khớp: "*if a default output value d is specified, DTI=FEEL(d)*", ngược lại "*DTI=null*".
  - Tr. 120: "*A decision table may have no rule hit for a set of input values. In this case, the result is given by the default output value, or null if no default output value is specified.*"

#### 2.2.3. Hit policy

- Mục 8.2.11, tr. 73: "*The hit policy specifies what the result of the decision table is in cases of overlapping rules, i.e., when more than one rule matches the input data.*"
- Tr. 74: "*The character is the initial letter of the defined hit policy (Unique, Any, Priority, First, Collect, Output order or Rule order).*"
- Tr. 74: "*The hit policy SHALL default to Unique, in which case the hit indicator is optional. Decision tables with the Unique hit policy SHALL NOT contain overlapping rules.*"
- **Câu cho phép hỗ trợ một tập con** (đã có ở Chương 1, tr. 74): "*Tools may support only a nonempty subset of hit policies, but the table type SHALL be clear and therefore the hit policy indication is mandatory, except for the default unique tables. Unique tables SHALL always be supported.*"
- Mục 8.2.11.1, tr. 74: "*A single hit table shall return the output of one rule only; a multiple hit table may return the output of multiple rules (or a function of the outputs, e.g., sum of values).*"

Bảy hit policy, nguyên văn mục 8.2.11.1 (tr. 74–75):

| # | Hit policy | Loại | Nguyên văn DMN 1.6 |
|---|---|---|---|
| 1 | Unique (U) | single | "*no overlap is possible, and all rules are disjoint. Only a single rule can be matched. This is the default.*" |
| 2 | Any (A) | single | "*there may be overlap, but all the matching rules show equal output entries for each output (ignoring rule annotations), so any match can be used. If the output entries are non-equal (ignoring rule annotations), the hit policy is incorrect, and the result is undefined.*" |
| 3 | Priority (P) | single | "*multiple rules can match, with different output entries. This policy returns the matching rule with the highest output priority. Output priorities are specified in the ordered list of output values, in decreasing order of priority. Note that priorities are independent from rule sequence.*" |
| 4 | First (F) | single | "*multiple (overlapping) rules can match, with different output entries. The first hit by rule order is returned (and evaluation can halt).*" |
| 5 | Output order (O) | multiple | "*returns all hits in decreasing output priority order. Output priorities are specified in the ordered list of output values in decreasing order of priority.*" |
| 6 | Rule order (R) | multiple | "*returns all hits in rule order. Note: the meaning may depend on the sequence of the rules.*" |
| 7 | Collect (C) | multiple | "*returns either all hits in arbitrary order, or the result of applying a simple function to them. An operator ('+', '<', '>', '#') can be added. If no operator is present, the result is the list of the output entries of all the rules matched.*" |

- Toán tử của Collect (tr. 75):
  - "*+ (sum): the result of the decision table is the sum of all the outputs.*"
  - "*< (min): the result of the decision table is the smallest value of all the outputs.*"
  - "*> (max): the result of the decision table is the largest value of all the outputs.*"
  - "*# (count): the result of the decision table is the number of outputs.*"
- Nhận xét của chuẩn về First (tr. 74): "*first hit tables are not considered good practice because they do not offer a clear overview of the decision logic.*" và "*The last rule is often the catch-remainder.*"
- Note 2 (tr. 75): "*The sequence of the rules in a decision table does not influence the meaning, except in First tables (single hit) and Rule order tables (multiple hit).*"
- Bảng nhiều đầu ra (tr. 75): "*Decision tables with compound outputs support only the following hit policies: Unique, Any, Priority, First, Output order, Rule order and Collect without operator, because the collect operator is undefined over multiple outputs.*"
- Bản tóm tắt ở mục 10.3.2.10 (tr. 120): "*Priority – multiple rules can match, with different outputs. The output that comes first in the supplied output values list is returned,*". Như vậy PRIORITY của DMN **luôn** dựa vào danh sách giá trị đầu ra (output values), không dựa vào thuộc tính của luật.

#### 2.2.4. FEEL, S-FEEL và mức tuân thủ

- **Mức tuân thủ** (mục 2.1 Conformance levels, tr. 1):
  - "*The specification defines three levels of conformance, namely Conformance Level 1, Conformance Level 2, and Conformance Level 3.*"
  - Level 1: "*SHALL comply with all of the specifications set forth in clauses 6 (Decision Requirements), 7 (Decision Logic) and 8 (Decision Table) of this document. An implementation claiming conformance to Conformance Level 1 is never required to interpret expressions (modeled as an Expression elements) in decision models.*"
  - Level 2: tuân thủ mục 6, 7, 8 và "*In addition, it is required to interpret expressions in the simple expression language (S-FEEL) specified in clause 9.*"
  - Level 3: tuân thủ mục 6, 7, 8 "*and 10 (Expression language)*".
  - Quan hệ giữa các mức: "*the simple expression language that is specified in clause 9 is a subset of FEEL, and that, therefore, an implementation claiming conformance to Conformance Level 3 can also claim conformance to Conformance Level 2 (and to Conformance Level 1).*"
  - **Câu rất quan trọng cho cách diễn đạt trong đồ án** (tr. 1): "*Software developed only partially matching the applicable compliance points may claim that the software was based on this specification but may not claim compliance or conformance with this specification.*"
- **FEEL** (mục 10.1, tr. 89):
  - "*FEEL stands for Friendly Enough Expression Language, and it has the following features:*" "*Side-effect free*", "*Simple data model with numbers, dates, strings, lists, and contexts*", "*Simple syntax designed for a wide audience*", "*Three-valued logic (true, false, null)*".
  - Mục 10.3.2.4, tr. 111: "*FEEL, like SQL and PMML, uses of ternary logic for truth values.*" Lỗi ngữ pháp "uses of" có sẵn trong bản gốc.
- **S-FEEL** (mục 9.1, tr. 83):
  - "*This section defines a simple subset of FEEL, S-FEEL, for the purpose of giving standard executable semantics to decision models that use only simple expressions: in particular, decision models where the decision logic is modeled mostly or only using decision tables.*"
  - Cũng tr. 83: "*Developers and users are therefore encouraged to use and implement the full FEEL specification rather than the S-FEEL subset.*"
- **Lượng từ some/every của FEEL**, tương ứng với `some`/`all` của đồ án:
  - Ngữ pháp 46 (mục 10.3.1.2, tr. 105): `quantified expression = ("some" | "every") , name , "in" , expression , ... "satisfies" ...`.
  - Ngữ nghĩa (Table 50, mục 10.3.2.15, tr. 127): "*When the Cartesian product is empty, the some ... satisfies quantifier returns false and the every ... satisfies quantifier returns true.*"
  - Mục 10.5.12–10.5.13, tr. 164: "*Every is an expression where all "satisfies" needs to be true for it to return true.*"; "*Some is an expression where at least one of the "satisfies" needs to be true for it to return true.*"
- **B-FEEL** (mục 11.1, tr. 169) là phương ngữ mới của FEEL, rất gần với "điều hướng an toàn" của đồ án:
  - "*In FEEL, the null value is used to both represent missing data or an execution error. In B-FEEL, null is used only to represent missing data.*"
  - "*A warning message should still be produced when an error occurs.*"
  - Mục 11.2, tr. 169: "*In B-FEEL boolean operators ( =, <=, <, >, >=, not(), and, or, in, between ) always return a true or false result (never null) even when incompatible types are used in their expression.*" và "*In B-FEEL an incompatible type in a boolean expression is considered false with the exception of the not equal (!=) where it is considered true.*"
  - Ví dụ trong bảng: `null >= 1` cho kết quả FEEL `null`, B-FEEL `false`.

**Gợi ý dùng cho mục 2.2**
- **2.2.1**: chỉ trình bày ngắn về DRG/DRD. Đồ án chỉ hiện thực tầng *decision logic* (một bảng quyết định cho mỗi quyết định), không hiện thực DRG nhiều quyết định phụ thuộc nhau. Cần nói rõ đây là giới hạn phạm vi.
- **2.2.2**: định nghĩa bảng quyết định [2, tr. 65] và cách đọc luật [2, tr. 67] tương ứng trực tiếp với tệp định nghĩa quyết định YAML: cột là trường dữ kiện, ô là điều kiện, mỗi dòng là một luật. Nguyên tắc "không có tác dụng phụ" [2, tr. 72] ủng hộ thiết kế lõi thuần (ADR-0001).
- **2.2.3**:
  - Câu §8.2.11 [2, tr. 74] cho phép chọn 4/7 hit policy (FIRST, UNIQUE, PRIORITY, COLLECT). Unique là bắt buộc và đồ án có hỗ trợ.
  - **PRIORITY khác chuẩn**: DMN xếp theo thứ tự danh sách giá trị đầu ra và "*priorities are independent from rule sequence*" [2, tr. 74]. Đồ án xếp theo trọng số ưu tiên gắn với luật. Nên viết rõ: "đồ án giữ tên PRIORITY nhưng ngữ nghĩa là ưu tiên theo trọng số của luật, không phải theo thứ tự giá trị đầu ra như DMN".
  - Dẫn câu "*may claim that the software was based on this specification but may not claim compliance*" [2, tr. 1] để giải thích vì sao đồ án ghi "dựa trên DMN", không ghi "tuân thủ DMN".
- **2.2.4**: đồ án dùng AST JSON thay FEEL/S-FEEL, nên không đạt Level 2/3; Level 1 cũng không đạt trọn vì không hiện thực DRG (mục 6). Lượng từ `some`/`all` của đồ án có tiền lệ là `some`/`every` của FEEL. Quy ước "tập rỗng → some = false, every = true" [2, tr. 127] nên áp dụng giống hệt, và `none` = phủ định của `some`. Hành vi "thiếu trường → false + cảnh báo" của đồ án gần với B-FEEL [2, tr. 169] hơn FEEL (FEEL trả `null`).

---

### 2.3. Mô hình thực thi luật

**(1) Ngữ nghĩa tổng quát Match – Conflict resolution – Act (PRR 1.0, mục 7.2.5, tr. 8)** [T3]
- "*The operational semantics of production rules in general for forward chaining rules (via a production rule engine) are as follows:*"
  - "*i. Match: the rules are instantiated based on the definition of the rule conditions and the current state of the data source*"
  - "*ii. Conflict resolution: select rule instances to be executed, per strategy*"
  - "*iii. Act: change state of data source, by executing the selected rule instances' actions*"
- Ngay sau đó: "*However, where rule engines are not used and a simpler sequential processing of rules takes place, there is no conflict resolution and a simpler strategy for executing rules.*"

**(2) Suy diễn tiến (forward chaining)**
- PRR mục 7.2.5.1, tr. 8 [T3]: "*A forward chaining production ruleset is defined without consideration of the explicit ordering of the rules; execution ordering is under the control of the inference engine that maintains a stateful representation of rule bindings.*"
- Vòng lặp (tr. 8): "*This sequence is repeated for each rule instance until no further rules can be matched, or an explicit end state is reached through an action.*"
- Hệ quả (tr. 8): "*An action may modify the data source, which can affect current as well as subsequent bindings and condition matches.*"
- Rete (tr. 8): "*One popular algorithm for implementing such a forward chaining production rule is the Rete algorithm [RETE].*" Chú thích chân trang của PRR dẫn: "*Charles Forgy, "Rete: A Fast Algorithm for the Many Pattern/Many Object Pattern Match Problem," Artificial Intelligence, 19, pp 17-37, 1982*".
- Drools 10.2.0 [S1] (đã có, = [4]), mục "Rule evaluation with forward and backward chaining":
  - "*A forward-chaining rule system is a data-driven system that starts with a fact in the working memory of the Drools rule engine and reacts to changes to that fact.*"
  - "*In contrast, a backward-chaining rule system is a goal-driven system that starts with a conclusion that the Drools rule engine attempts to satisfy, often using recursion.*"

**(3) Đánh giá tuần tự (sequential)**
- PRR mục 7.2.5.2, tr. 8–9 [T3]:
  - "*A sequential production rule is a production rule defined without re-evaluation of rule ordering during execution.*"
  - Các bước: Bind (một lần), rồi "*Evaluate: evaluate the rule conditions based on the current state of the data source. Each instance is treated as a separate rule. If the condition evaluates to false, then the rule instance is not considered.*" và "*Act: execute the action list of the current rule instance*".
  - "*The instances to be executed are defined on the initial state of the data source. Side effects from the execution of one instance will not affect the eligibility of other instances for execution.*"
  - "*Rule execution order is determined by the specified sequence of the rules in the ruleset.*"
- PRR mục 7.2.1, tr. 6: "*The effect of executing production rules may depend on the ordering of the rules, irrespective of whether such ordering is defined by the rule execution mechanism or the ordered representation of the rules.*"
- Drools sequential mode [S1] (đã có, = [4]), đã đối chiếu lại:
  - "*Sequential mode is an advanced rule base configuration in the Drools rule engine, supported by Phreak, that enables the Drools rule engine to evaluate rules one time in the order that they are listed in the Drools rule engine agenda without regard to changes in the working memory. In sequential mode, the Drools rule engine ignores any insert, modify, or update statements in rules and executes rules in a single sequence. As a result, rule execution may be faster in sequential mode, but important updates may not be applied to your rules.*"
  - "*Sequential mode applies to only stateless KIE sessions because stateful KIE sessions inherently use data from previously invoked KIE sessions.*"

**(4) Thuật toán Rete**
- Bài báo gốc [T5]: Charles L. Forgy, "Rete: A fast algorithm for the many pattern/many object pattern match problem", *Artificial Intelligence*, tập 19, số 1, tr. 17–37, tháng 9/1982, DOI 10.1016/0004-3702(82)90020-0, Elsevier.
  - Dữ liệu thư mục được xác minh qua **Crossref** (siêu dữ liệu do Elsevier đăng ký cho DOI).
  - Trang ScienceDirect trả về HTTP 403, nên **chưa đọc được abstract trên trang nhà xuất bản**. **Không trích nội dung** bài báo.
  - PRR [T3, tr. 8] dẫn cùng thông tin thư mục (tập 19, tr. 17–37, 1982), nên có thể dùng PRR làm xác nhận độc lập.
- Mô tả Rete từ nguồn sơ cấp còn dùng được:
  - Drools [S1]: "*While Rete is considered eager (immediate rule evaluation) and data oriented, Phreak is considered lazy (delayed rule evaluation) and goal oriented. The Rete algorithm performs many actions during the insert, update, and delete actions in order to find partial matches for all rules. This eagerness of the Rete algorithm during rule matching requires a lot of time before eventually executing rules, especially in large systems.*"
  - Fowler [S30] (đã có, = [3]): "*More efficient execution engines help to quickly evaluate conditions on hundreds of rules using specialized algorithms (such as the Rete algorithm).*" và "*Chaining sounds appealing, since it supports more complex behaviors, but can easily end up being very hard to reason about and debug.*"
- Sách AIMA (Russell & Norvig) [T6]: chỉ xác minh được dữ liệu thư mục trên trang Pearson: "Artificial Intelligence: A Modern Approach", 4th edition, ngày xuất bản 21/12/2021, Copyright 2022, ISBN-13 9780137505135. Mục lục trên trang có "Chapter 9: Inference in First-Order Logic". **Chưa đọc nội dung**, không trích. Có thể bỏ nếu PRR + Drools đã đủ.

**Gợi ý dùng cho mục 2.3**
- **2.3.1 Đánh giá tuần tự**: dùng PRR §7.2.5.2 [T3, tr. 8–9] làm định nghĩa chuẩn cho mô hình thực thi của đồ án:
  - đánh giá một lượt trên trạng thái dữ kiện ban đầu;
  - không *conflict resolution* theo nghĩa production system; thay vào đó hit policy quyết định cách tổng hợp kết quả;
  - kết quả đầu ra không làm thay đổi dữ kiện, nên không kích hoạt lại luật khác.
  Đặt cạnh sequential mode của Drools [4] để chỉ ra một engine lớn cũng có chế độ tương tự cho phiên stateless. Kết hợp DMN 8.2.8 [2, tr. 72] (không tác dụng phụ) và "*Matching is unordered*" [2, tr. 120].
- **2.3.2 Rete, lý do không chọn**:
  - Rete phục vụ suy diễn tiến có trạng thái (working memory, các hành động sửa dữ kiện, khớp lại). Đồ án không có các yếu tố này vì lõi thuần, dữ kiện bất biến trong một lần gọi (ADR-0001).
  - Fowler [3] cảnh báo chaining khó lập luận và gỡ lỗi; điều này mâu thuẫn với yêu cầu vết đánh giá.
  - Chính Drools [4] cũng đã chuyển từ Rete sang Phreak.
  - Dẫn Forgy [T5] làm nguồn gốc thuật toán, nhưng chỉ dẫn thông tin thư mục, không trích nội dung.

---

### 2.4. Biểu diễn điều kiện an toàn bằng cây cú pháp trừu tượng (AST)

**(1) AST — nguồn định nghĩa**
- Sách "Dragon Book" [T7]: InformIT (Pearson) ghi "*Compilers: Principles, Techniques, and Tools, 2nd Edition*", tác giả Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman, "*Published Aug 31, 2006 by Pearson*", Copyright 2007, ISBN-13 978-0-321-48681-3, 1040 trang. Mục lục trên trang có mục 6.1 "Variants of Syntax Trees" nhưng không ghi số trang. **Chưa đọc nội dung**, không trích nguyên văn định nghĩa AST từ sách.
- Ví dụ sơ cấp trong chính ngôn ngữ Go, gói `go/ast` (go1.27.1) [T8]:
  - "*Package ast declares the types used to represent syntax trees for Go packages. Syntax trees may be constructed directly, but they are typically produced from Go source code by the parser; see the go/parser.ParseFile function.*"
  - "*All node types implement the Node interface.*"
  - "*All expression nodes implement the Expr interface.*"
  - Về hàm `Walk`: "*Walk traverses an AST in depth-first order*".

**(2) Tiền lệ "luật dưới dạng JSON AST": JsonLogic** [T9], [T10]. Trang do Jeremy Wadhams duy trì ("*json-logic is maintained by Jeremy Wadhams*").
- "*Build complex rules, serialize them as JSON, share them between front-end and back-end*" [T9]
- "*JsonLogic isn't a full programming language. It's a small, safe way to delegate one decision.*" [T9]
- "*Because the rule is data, you can even build it dynamically from user actions or GUI input.*" [T9]
- "*JsonLogic has no setters, no loops, no functions or gotos. One rule leads to one decision, with no side effects and deterministic computation time.*" [T9]
- "*Secure. We never eval(). Rules only have read access to data you provide, and no write access to anything.*" [T9]
- Dạng nút: "*{"operator" : ["values" ... ]} Always.*" [T9]
- Trang Operations [T10]:
  - Các toán tử `all`, `none`, `some`: "*These operations take an array, and perform a test on each member of that array. The most interesting part of these operations is that inside the test code, var operations are relative to the array element being tested.*"
  - `var` với giá trị mặc định: "*You can supply a default, as the second argument, for values that might be missing in the data object.*"

**(3) An toàn: tiêm mã và eval**
- OWASP, trang "Code Injection" (tác giả trên trang: Weilin Zhong, Rezos) [T11]: "*Code Injection is the general term for attack types which consist of injecting code that is then interpreted/executed by the application. This type of attack exploits poor handling of untrusted data.*"
- MITRE CWE-94 "Improper Control of Generation of Code ('Code Injection')" (CWE 4.20) [T12]:
  - Description: "*The product constructs all or part of a code segment using externally-influenced input from an upstream component, but it does not neutralize or incorrectly neutralizes special elements that could modify the syntax or behavior of the intended code segment.*"
  - Biện pháp (Architecture and Design, Strategy: Refactoring): "*Refactor your program so that you do not have to dynamically generate code.*"
- MITRE CWE-95 "Improper Neutralization of Directives in Dynamically Evaluated Code ('Eval Injection')" (CWE 4.20) [T13]:
  - Description: "*The product receives input from an upstream component, but it does not neutralize or incorrectly neutralizes code syntax before using the input in a dynamic evaluation call (e.g. "eval").*"
  - Biện pháp (Architecture and Design; Implementation, Strategy: Refactoring): "*If possible, refactor your code so that it does not need to use eval() at all.*"

**Gợi ý dùng cho mục 2.4**
- Định nghĩa AST bằng lời của tác giả, có thể dẫn [T7] như tài liệu tham khảo chung (không trích nguyên văn). Minh hoạ bằng `go/ast` [T8]: chính Go biểu diễn chương trình dưới dạng cây nút có giao diện chung (`Node`, `Expr`). Đây là mẫu thiết kế cho kiểu nút điều kiện của đồ án, được duyệt bằng bộ đánh giá đệ quy (tree-walking).
- JsonLogic [T9], [T10] là tiền lệ gần nhất cho ADR-0002:
  - luật là dữ liệu JSON dạng `{toán tử: [tham số]}`;
  - không vòng lặp, không gán, không tác dụng phụ;
  - "*We never eval()*";
  - có sẵn `all`/`none`/`some` trên mảng — trùng với lượng từ của đồ án.
  Khác biệt của đồ án: kiểm tra kiểu và lược đồ khi biên dịch YAML → AST; thiếu trường thì trả `false` kèm cảnh báo trong vết, thay vì giá trị mặc định do người viết luật cung cấp.
- CWE-95 [T13] và CWE-94 [T12] là cơ sở an toàn: biện pháp được MITRE khuyến nghị là không dùng `eval` / không sinh mã động. Đồ án làm đúng như vậy: chỉ có một tập toán tử đóng (`==`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `not_in`, `and`/`or`/`not`, `some`/`all`/`none`), được thông dịch trên AST, không biên dịch hay thực thi chuỗi. Định nghĩa của OWASP [T11] dùng cho câu mở đầu về nguy cơ.

---

### 2.5. Quản lý phiên bản và vòng đời cấu hình

**(1) Semantic Versioning 2.0.0** [T14] (tác giả "*originally authored by Tom Preston-Werner*")
- Tóm tắt: "*Given a version number MAJOR.MINOR.PATCH, increment the: MAJOR version when you make incompatible API changes MINOR version when you add functionality in a backward compatible manner PATCH version when you make backward compatible bug fixes*"
- Điều 1: "*Software using Semantic Versioning MUST declare a public API.*"
- **Điều 3, tính bất biến**: "*Once a versioned package has been released, the contents of that version MUST NOT be modified. Any modifications MUST be released as a new version.*"

**(2) Blue-green deployment, chuyển "bộ định tuyến" để rollback** — Fowler, bliki *BlueGreenDeployment*, 01/03/2010 [T15]
- "*The blue-green deployment approach does this by ensuring you have two production environments, as identical as possible.*"
- "*Once the software is working in the green environment, you switch the router so that all incoming requests go to the green environment - the blue one is now idle.*"
- "*Blue-green deployment also gives you a rapid way to rollback - if anything goes wrong you switch the router back to your blue environment.*"
- "*The fundamental idea is to have two easily switchable environments to switch between, there are plenty of ways to vary the details.*"

**(3) Google SRE, chương 8 "Release Engineering"** (Dinah McNutt; biên tập Betsy Beyer, Tim Harvey) [T16]
- Nhãn di chuyển được, tương tự con trỏ: "*MPM supports applying labels to a particular version of a package.*"; "*Labels can be applied to an MPM package to indicate a package's location in the release process (e.g., dev, canary, or production). If you apply an existing label to a new package, the label is automatically moved from the old package to the new package.*"
- Định danh duy nhất: "*Packages are named (e.g., search/shakespeare/frontend), versioned with a unique hash, and signed to ensure authenticity.*"
- Cấu hình là nguồn rủi ro: "*Although configuration management may initially seem a deceptively simple problem, configuration changes are a potential source of instability.*"
- Tái lập: "*Similar to our treatment of binaries, we can use the build ID to reconstruct the configuration at a specific point in time.*"
- Cấu hình thay đổi lúc chạy: "*Some projects have configuration files that need to change frequently or dynamically (i.e., while the binary is running).*"
- Mục tiêu tái lập được: "*Site Reliability Engineers (SREs) need to know that the binaries and configurations they use are built in a reproducible, automated way so that releases are repeatable and aren't "unique snowflakes."*"

**(4) Google SRE Workbook, chương 16 "Canarying Releases"** (Alec Warner, Štěpán Davidovič, cùng Alex Hidalgo, Betsy Beyer, Kyle Smith, Matt Duftler) [T17]
- Định nghĩa: "*We define canarying as a partial and time-limited deployment of a change in a service and its evaluation. This evaluation helps us decide whether or not to proceed with the rollout.*"
- "*Canarying is effectively an A/B testing process.*"
- Về blue/green: "*The cutover doesn't require downtime, and rollback is a trivial reversal of the router change.*"
- Khi không có rollback: "*let's say that our deployment process doesn't provide us the option to roll back to a previously known good configuration. Our best option to fix the errors is to find defects in the production version, patch them, and deploy a new version during the outage. This course of action will almost certainly prolong the user impact of the bug.*"
- "*Smaller, self-contained release artifacts make it cheaper and easier to roll back any given release artifact in the event of a bug.*"

**Gợi ý dùng cho mục 2.5**
- **SemVer → lý do không dùng**:
  - SemVer giả định có một "public API" được khai báo và người phát hành tự đánh giá tính tương thích [T14, điều 1].
  - ADR-0007 nêu rằng semver "*would imply compatibility guarantees nothing checks*". Đồ án vì vậy dùng số nguyên tăng dần do dịch vụ cấp lúc phát hành.
  - Đồ án **giữ** nguyên tắc bất biến của SemVer điều 3 [T14]: phiên bản đã phát hành không được sửa, mọi thay đổi phải thành phiên bản mới. Đây đúng là tính chất của phiên bản quyết định.
- **Con trỏ *latest* và *rollback***: blue-green [T15] mô tả rollback bằng "switch the router back". Nhãn MPM của Google [T16] là nhãn tự di chuyển sang gói mới. Cả hai là tiền lệ cho thiết kế *latest* = con trỏ tường minh: phát hành = di chuyển con trỏ tới; *rollback* = di chuyển con trỏ lùi, không xoá phiên bản mới. SRE Workbook [T17] nêu hệ quả khi không có rollback nhanh.
- **Bản nháp → mô phỏng → phát hành**: câu "*configuration changes are a potential source of instability*" [T16] biện minh cho việc bắt buộc mô phỏng (ca kiểm thử) trước khi phát hành. Canarying [T17] là cách kiểm chứng thay đổi trên một phần lưu lượng thật; đồ án **không** làm canary và chỉ kiểm chứng offline bằng ca kiểm thử. Nên nêu canary/A-B như hướng phát triển (ADR-0003 có nhắc A/B nhờ đánh giá song song nhiều phiên bản).
- **Cấu hình nạp lúc chạy** ("*while the binary is running*" [T16]) là tiền lệ cho *hot reload* phiên bản quyết định vào bộ đăng ký.

---

### 2.6. Lập trình đồng thời trong Go

**(1) Goroutine và câu lệnh `go`** — The Go Programming Language Specification, "*Language version go1.27 (May 26, 2026)*" [T18], mục "Go statements":
- "*A "go" statement starts the execution of a function call as an independent concurrent thread of control, or goroutine, within the same address space.*"
- "*The function value and parameters are evaluated as usual in the calling goroutine, but unlike with a regular call, program execution does not wait for the invoked function to complete. Instead, the function begins executing independently in a new goroutine.*"
- Phần mở đầu của đặc tả: "*It is strongly typed and garbage-collected and has explicit support for concurrent programming.*"

**(2) The Go Memory Model**, "*Version of June 6, 2022*" [T19]
- "*The Go memory model specifies the conditions under which reads of a variable in one goroutine can be guaranteed to observe values produced by writes to the same variable in a different goroutine.*"
- Mục Advice: "*Programs that modify data being simultaneously accessed by multiple goroutines must serialize such access. To serialize access, protect the data with channel operations or other synchronization primitives such as those in the sync and sync/atomic packages.*"
- "*If you must read the rest of this document to understand the behavior of your program, you are being too clever. Don't be clever.*"
- Định nghĩa data race: "*A data race is defined as a write to a memory location happening concurrently with another read or write to that same location, unless all the accesses involved are atomic data accesses as provided by the sync/atomic package.*"

**(3) Gói `sync`, kiểu `RWMutex`** (pkg.go.dev, go1.27.1) [T20]
- Tổng quan gói: "*Package sync provides basic synchronization primitives such as mutual exclusion locks. Other than the Once and WaitGroup types, most are intended for use by low-level library routines. Higher-level synchronization is better done via channels and communication.*"
- Kiểu `RWMutex`: "*A RWMutex is a reader/writer mutual exclusion lock. The lock can be held by an arbitrary number of readers or a single writer. The zero value for a RWMutex is an unlocked mutex.*"
- "*A RWMutex must not be copied after first use.*"
- "*If any goroutine calls RWMutex.Lock while the lock is already held by one or more readers, concurrent calls to RWMutex.RLock will block until the writer has acquired (and released) the lock, to ensure that the lock eventually becomes available to the writer. Note that this prohibits recursive read-locking.*"
- `Lock`: "*Lock locks rw for writing. If the lock is already locked for reading or writing, Lock blocks until the lock is available.*"
- `RLock`: "*RLock locks rw for reading. It should not be used for recursive read locking; a blocked Lock call excludes new readers from acquiring the lock.*"
- Liên hệ memory model: "*In the terminology of the Go memory model, the n'th call to RWMutex.Unlock "synchronizes before" the m'th call to Lock for any n < m, just as for Mutex.*"

**(4) Gói `sync/atomic`, kiểu `atomic.Pointer`** (go1.27.1) [T21]
- "*Package atomic provides low-level atomic memory primitives useful for implementing synchronization algorithms. These functions require great care to be used correctly. Except for special, low-level applications, synchronization is better done with channels or the facilities of the sync package. Share memory by communicating; don't communicate by sharing memory.*"
- "*A Pointer is an atomic pointer of type \*T. The zero value is a nil \*T. Pointer must not be copied after first use.*" Ghi chú phiên bản: "added in go1.19".
- `Load`: "*Load atomically loads and returns the value stored in x.*"

**(5) Data Race Detector** (go.dev/doc/articles/race_detector) [T22]
- "*Data races are among the most common and hardest to debug types of bugs in concurrent systems. A data race occurs when two goroutines access the same variable concurrently and at least one of the accesses is a write.*"
- "*To help diagnose such bugs, Go includes a built-in data race detector. To use it, add the -race flag to the go command*"
- Giới hạn: "*The race detector only finds races that happen at runtime, so it can't find races in code paths that are not executed.*"
- Chi phí: "*for a typical program, memory usage may increase by 5-10x and execution time by 2-20x.*"

**(6) Effective Go, mục Concurrency → "Share by communicating"** [T23]
- "*Do not communicate by sharing memory; instead, share memory by communicating.*"
- Ngay sau khẩu hiệu là câu cân bằng: "*This approach can be taken too far. Reference counts may be best done by putting a mutex around an integer variable, for instance.*"
- **Lưu ý về độ mới của tài liệu**: trang ghi "*Note: This document was written for Go's release in 2009 and is not actively updated.*"

**Gợi ý dùng cho mục 2.6**
- Trình bày goroutine [T18] → nguy cơ data race [T19], [T22] → hai cách đồng bộ: kênh và khoá. Dẫn câu cân bằng của Effective Go [T23]: khẩu hiệu ưu tiên kênh, nhưng khoá quanh dữ liệu dùng chung vẫn hợp lý.
- **Bộ đăng ký quyết định dùng `sync.RWMutex`** [T20]. Mẫu truy cập là đọc rất nhiều (mỗi lần Evaluate tra bộ đăng ký) và ghi rất ít (phát hành, *rollback*, *hot reload*), khớp với mô tả "*held by an arbitrary number of readers or a single writer*". Câu về writer không bị bỏ đói cho thấy *hot reload* không bị chặn vô hạn khi tải đọc cao. Cảnh báo "*prohibits recursive read-locking*" là ràng buộc cài đặt: không gọi `RLock` lồng nhau.
- Có thể nhắc `atomic.Pointer` [T21] như phương án thay thế: thay nguyên bản chụp bộ đăng ký bất biến (copy-on-write). Nêu lý do chọn RWMutex (đơn giản, nhiều khoá theo decisionId) hoặc ngược lại tuỳ cài đặt thực tế. Chính tài liệu `sync/atomic` khuyên "*These functions require great care*".
- **Race detector** [T22] là công cụ kiểm thử cho mục 5.3 (*hot reload* đồng thời với Evaluate). Phải nêu giới hạn "*only finds races that happen at runtime*": kết quả "không phát hiện race" chỉ có giá trị trên các nhánh mã đã chạy.

---

### 2.7. Mô hình C4 và UML trong mô tả kiến trúc phần mềm

**(1) Mô hình C4** — c4model.com, trang chính thức "*written by its creator Simon Brown*" [T24]
- Định nghĩa tổng quát [T24]: "*The C4 model is an easy to learn, developer friendly approach to software architecture diagramming*", gồm "*A set of hierarchical abstractions - software systems, containers, components, and code.*", "*A set of hierarchical diagrams - system context, containers, components, and code.*", "*An additional set of supporting diagrams - system landscape, dynamic, and deployment.*", "*Notation independent.*", "*Tooling independent.*"
- Trang Diagrams [T25]:
  - "*The C4 model is named after the core set of static structure diagrams: (system) context, containers, components, and code.*"
  - "*you don't need to use all 4 levels of diagram; only those that add value - the system context and container diagrams are sufficient for most software development teams.*"
- Trang Abstractions [T30]: "*A software system is made up of one or more containers (applications and data stores), each of which contains one or more components, which in turn are implemented by one or more code elements (classes, interfaces, objects, functions, etc).*"
- **Cấp 1 – System context** [T26]: "*Draw a diagram showing your system as a box in the centre, surrounded by its users and the other systems that it interacts with.*"; "*The focus should be on people (actors, roles, personas, etc) and software systems rather than technologies, protocols and other low-level details.*" Mục Recommended: "*Yes, a system context diagram is recommended for all software development teams.*"
- **Cấp 2 – Container** [T27]: "*In C4, a container is an application or a data store.*"; "*The container diagram shows the high-level shape of the software architecture and how responsibilities are distributed across it. It also shows the major technology choices and how the containers communicate with one another.*"
- **Cấp 3 – Component**:
  - Trang sơ đồ [T28]: "*Next you can zoom in and decompose a container to describe the components that reside inside it; including their responsibilities and the technology/implementation details.*" Mục Recommended: "*No, only create component diagrams if you feel they add value, and consider automating their creation for long-lived documentation.*"
  - Trang khái niệm Component [T31]: "*in the C4 model, a component is a grouping of related functionality encapsulated behind a well-defined interface.*"; "*With the C4 model, components are not separately deployable units. Instead, it's the container that's the deployable unit. In other words, all components inside a container execute in the same process space.*"
- **Cấp 4 – Code, là tuỳ chọn** [T29]:
  - "*Finally, you can zoom in to a component to show how it is implemented as code; using UML class diagrams, entity relationship diagrams or similar. This is very much an optional level of detail and is often available on-demand from tooling such as IDEs.*"
  - "*This level of detail is not recommended for anything but the most important or complex components.*"
  - Mục Recommended: "*No, particularly for long-lived documentation because most IDEs can generate this level of detail on demand.*"
- Quan hệ với UML (FAQ) [T32]: "*Despite this, the C4 model was inspired by UML and the 4+1 model for software architecture. In summary, you can think of the C4 model as a simplified version of the underlying concepts*".

**(2) C4-PlantUML và stdlib của PlantUML**
- Repo `plantuml-stdlib/C4-PlantUML` (giấy phép MIT, bản phát hành mới nhất v2.14.0 ngày 26/08/2026) [T33]. README: "*C4-PlantUML combines the benefits of PlantUML and the C4 model for providing a simple way of describing and communicating software architectures – especially during up-front design sessions – with an intuitive language using open source and platform independent tools.*"
- README về stdlib [T33]: "*If you don't need the up-to-date version, PlantUML includes the last released `C4_...` files as standard library C4 (no additional files or Internet is required). You can use it with following:*" rồi đến `!include <C4/C4_Container>`.
- Trang PlantUML Standard Library [T34], mục "C4 Library [C4]": stdlib trỏ tới `https://github.com/plantuml/plantuml-stdlib/tree/master/C4`, mã nguồn `https://github.com/plantuml-stdlib/C4-PlantUML`, ví dụ `!include <C4/C4_Container>`.
- Trên máy tác giả: PlantUML 1.2026.6, stdlib C4 **2.13.0**. Bản này cũ hơn v2.14.0 trên GitHub một bản. Không ảnh hưởng gì nếu không dùng tính năng mới của 2.14.0.

**(3) OMG UML 2.5.1** (formal/2017-12-05, December 2017) [T35]
- **Lớp** (mục 11.4 Classes, 11.4.1 Summary, tr. 194): "*The purpose of a Class is to specify a classification of objects and to specify the Features that characterize the structure and behavior of those objects.*"
- **Máy trạng thái** (mục 14.1 Summary, tr. 305): "*The StateMachines package defines a set of concepts that can be used for modeling discrete event-driven Behaviors using a finite state-machine formalism.*" và "*The specific form of finite state automata used in UML is based on an object-oriented variant of David Harel's statecharts formalism.*"
- **Sơ đồ tuần tự** (mục 17.8 Sequence Diagrams, tr. 595): "*The most common kind of Interaction Diagram is the Sequence Diagram, which focuses on the Message interchange between a number of Lifelines.*" và "*A sequence diagram describes an Interaction by focusing on the sequence of Messages that are exchanged, along with their corresponding OccurrenceSpecifications on the Lifelines.*" Ký hiệu nằm ở mục 17.8.1, tr. 595 trở đi.
- **Phân loại sơ đồ** (Annex A: Diagrams (normative), tr. 685):
  - "*Structure diagrams show the static structure of the objects in a system.*"
  - "*Behavior diagrams show the dynamic behavior of the objects in a system, including their methods, collaborations, activities, and state histories.*"
  - Tr. 685 liệt kê "*Class Diagram - Structured Classifiers*".

**Gợi ý dùng cho mục 2.7**
- Dùng mô hình C4 cấp 1–3 cho cấu trúc. Lý do không vẽ cấp 4: chính trang C4 ghi cấp Code "*very much an optional level of detail*" và không khuyến nghị cho tài liệu lâu dài [T29]. Cấp 4 vốn được vẽ bằng sơ đồ lớp UML, nên đồ án dùng thẳng sơ đồ lớp UML cho mô hình miền (mục 3.2). Cách này khớp với mục 5 của THESIS_STRUCTURE.md.
- **Một container BRE Service gồm hai nhóm component** (ADR-0006) có cơ sở trực tiếp: "*all components inside a container execute in the same process space*" [T31], và container là "*the deployable unit*".
- Hành vi dùng UML: sơ đồ tuần tự [T35, mục 17.8] cho Evaluate/Publish; sơ đồ trạng thái [T35, mục 14] cho vòng đời bản nháp → phiên bản quyết định. Không dùng sơ đồ Dynamic của C4 (đây chỉ là sơ đồ bổ trợ [T24]).
- Công cụ: C4-PlantUML qua stdlib `!include <C4/...>` [T33], [T34], render không cần mạng. Có thể nêu ở mục 4.1 kèm phiên bản PlantUML 1.2026.6 / C4 2.13.0.

---

## 3. Danh sách nguồn mới

Định dạng theo mục 7 của THESIS_STRUCTURE.md, xếp theo thứ tự nhóm. Chưa đánh số `[n]`.

Nguồn dùng lại từ Chương 1 (đã có số):
- [S29] = [1]: Business Rules Manifesto
- [S27] = [2]: OMG DMN 1.6
- [S30] = [3]: Fowler, *RulesEngine*
- [S1] = [4]: Drools rule engine 10.2.0

### Nhóm 3 — Sách tiếng nước ngoài

- [T6]. Russell, S., Norvig, P. (2021), *Artificial Intelligence: A Modern Approach*. 4th ed, Pearson, Hoboken.
  - Nơi xb chưa xác minh.
  - Trang Pearson ghi ngày xuất bản 21/12/2021, Copyright 2022, ISBN-13 9780137505135 (bản eTextbook): https://www.pearson.com/en-us/subject-catalog/p/artificial-intelligence-a-modern-approach/P200000003500/9780137505135 (truy cập 08/10/2026).
  - Chỉ dùng nếu cần, chưa đọc nội dung.
- [T7]. Aho, A. V., Lam, M. S., Sethi, R., Ullman, J. D. (2006), *Compilers: Principles, Techniques, and Tools*. 2nd ed, Pearson/Addison-Wesley, Boston.
  - Nơi xb và nhãn Addison-Wesley chưa xác minh.
  - InformIT ghi "Published Aug 31, 2006 by Pearson", Copyright 2007, ISBN-13 978-0-321-48681-3: https://www.informit.com/store/compilers-principles-techniques-and-tools-9780321486813 (truy cập 08/10/2026).
  - Chưa đọc nội dung.
- [T16]. McNutt, D. (2017), *Release Engineering*. In: Beyer, B., Jones, C., Petoff, J., Murphy, N. R. (eds), *Site Reliability Engineering [online]*. O'Reilly Media, viewed 08/10/2026, from: https://sre.google/sre-book/release-engineering/.
  - Ghép mẫu "Chương sách" với "Sách điện tử".
  - Năm lấy theo dòng "Copyright © 2017 Google, Inc. Published by O'Reilly Media, Inc." trên trang. Bản in thường được ghi 2016 nhưng chưa xác minh trên trang O'Reilly (HTTP 403).
- [T17]. Warner, A., Davidovič, Š. (2018), *Canarying Releases*. In: Beyer, B., Murphy, N. R., Rensin, D. K., Kawahara, K., Thorne, S. (eds), *The Site Reliability Workbook [online]*. O'Reilly Media, viewed 08/10/2026, from: https://sre.google/workbook/canarying-releases/.
  - Ghép mẫu như [T16]. Trang ghi thêm đồng tác giả "with Alex Hidalgo, Betsy Beyer, Kyle Smith, and Matt Duftler".

### Nhóm 4 — Báo, tạp chí

THESIS_STRUCTURE.md **không có mẫu cho bài báo tạp chí khoa học**: mẫu "Báo" dành cho báo in, có trường "Mục" và ngày dd/mm/yyyy. Đề xuất mẫu gần nhất, theo đề bài: `Tác giả (năm), *Tên bài*, Tên tạp chí, tập(số), tr.` Cần GVHD xác nhận.

- [T5]. Forgy, C. L. (1982), *Rete: A fast algorithm for the many pattern/many object pattern match problem*, Artificial Intelligence, 19(1), tr. 17–37.
  - DOI: 10.1016/0004-3702(82)90020-0.
  - Siêu dữ liệu xác minh qua Crossref (Elsevier BV), tháng 9/1982. Trang ScienceDirect trả HTTP 403.

### Nhóm 5 — Các trang web

Đặc tả, báo cáo luật nghiệp vụ:
- [T1]. Business Rules Group (2000), *Defining Business Rules ~ What Are They Really?, Final Report revision 1.3 [online]*, 08/10/2026, from: https://www.businessrulesgroup.org/first_paper/BRG-whatisBR_3ed.pdf.
  - Trước đây là "GUIDE Business Rules Project" (1995). Người soạn: D. Hay, K. A. Healy.
  - Có thể ghi tác giả là "Hay, D., Healy, K. A. (eds)" nếu GVHD muốn.
- [T2]. Object Management Group (2019), *Semantics of Business Vocabulary and Business Rules (SBVR), Version 1.5, formal/2019-10-02 [online]*, 08/10/2026, from: https://www.omg.org/spec/SBVR/1.5/PDF.
- [T3]. Object Management Group (2009), *Production Rule Representation (PRR), Version 1.0, formal/2009-12-01 [online]*, 08/10/2026, from: https://www.omg.org/spec/PRR/1.0/PDF.
- [T4]. Crowther, F., Kohli, D., Buecker, A. (2013), *Using IBM Operational Decision Manager: IMS COBOL BMP, COBOL DLIBATCH, and COBOL MPP, IBM Redpaper REDP-4997-00 [online]*, 08/10/2026, from: https://www.redbooks.ibm.com/abstracts/redp4997.html.
  - Chỉ trích phần Abstract trên trang. Có ISBN 978-0-7384-5100-8 nên cũng có thể xếp nhóm 3 theo mẫu "Sách điện tử".
- [T35]. Object Management Group (2017), *OMG Unified Modeling Language (OMG UML), Version 2.5.1, formal/2017-12-05 [online]*, 08/10/2026, from: https://www.omg.org/spec/UML/2.5.1/PDF.

AST, an toàn:
- [T8]. The Go Authors (2026), *ast package — go/ast — Go Packages, go1.27.1 [online]*, 08/10/2026, from: https://pkg.go.dev/go/ast.
- [T9]. Wadhams, J. (n.d.), *JsonLogic [online]*, 08/10/2026, from: https://jsonlogic.com/.
  - Trang không ghi năm; cần chọn cách ghi.
- [T10]. Wadhams, J. (n.d.), *JsonLogic — Supported Operations [online]*, 08/10/2026, from: https://jsonlogic.com/operations.html.
- [T11]. Zhong, W., Rezos (2021), *Code Injection — OWASP Foundation [online]*, 08/10/2026, from: https://owasp.org/www-community/attacks/Code_Injection.
  - Năm lấy theo commit cuối của tệp nguồn `pages/attacks/Code_Injection.md` trong repo OWASP/www-community (29/01/2021). Trang không ghi ngày.
- [T12]. MITRE Corporation (2026), *CWE-94: Improper Control of Generation of Code ('Code Injection'), CWE 4.20 [online]*, 08/10/2026, from: https://cwe.mitre.org/data/definitions/94.html.
- [T13]. MITRE Corporation (2026), *CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code ('Eval Injection'), CWE 4.20 [online]*, 08/10/2026, from: https://cwe.mitre.org/data/definitions/95.html.

Phiên bản, phát hành:
- [T14]. Preston-Werner, T. (n.d.), *Semantic Versioning 2.0.0 [online]*, 08/10/2026, from: https://semver.org/.
  - Trang không ghi năm phát hành 2.0.0.
- [T15]. Fowler, M. (2010), *BlueGreenDeployment [online]*, 08/10/2026, from: https://martinfowler.com/bliki/BlueGreenDeployment.html.

Go:
- [T18]. The Go Authors (2026), *The Go Programming Language Specification, Language version go1.27 [online]*, 08/10/2026, from: https://go.dev/ref/spec.
- [T19]. The Go Authors (2022), *The Go Memory Model, Version of June 6, 2022 [online]*, 08/10/2026, from: https://go.dev/ref/mem.
- [T20]. The Go Authors (2026), *sync package — sync — Go Packages, go1.27.1 [online]*, 08/10/2026, from: https://pkg.go.dev/sync.
- [T21]. The Go Authors (2026), *atomic package — sync/atomic — Go Packages, go1.27.1 [online]*, 08/10/2026, from: https://pkg.go.dev/sync/atomic.
- [T22]. The Go Authors (2026), *Data Race Detector [online]*, 08/10/2026, from: https://go.dev/doc/articles/race_detector.
  - Trang không ghi ngày; năm ước lượng theo bộ tài liệu go.dev hiện hành.
- [T23]. The Go Authors (2009), *Effective Go [online]*, 08/10/2026, from: https://go.dev/doc/effective_go.
  - Trang tự ghi "written for Go's release in 2009 and is not actively updated".

Mô hình C4, PlantUML:
- [T24]. Brown, S. (n.d.), *The C4 model for visualising software architecture [online]*, 08/10/2026, from: https://c4model.com/.
- [T25]. Brown, S. (n.d.), *Diagrams — C4 model [online]*, 08/10/2026, from: https://c4model.com/diagrams.
- [T26]. Brown, S. (n.d.), *System context diagram — C4 model [online]*, 08/10/2026, from: https://c4model.com/diagrams/system-context.
- [T27]. Brown, S. (n.d.), *Container diagram — C4 model [online]*, 08/10/2026, from: https://c4model.com/diagrams/container.
- [T28]. Brown, S. (n.d.), *Component diagram — C4 model [online]*, 08/10/2026, from: https://c4model.com/diagrams/component.
- [T29]. Brown, S. (n.d.), *Code diagram — C4 model [online]*, 08/10/2026, from: https://c4model.com/diagrams/code.
- [T30]. Brown, S. (n.d.), *Abstractions — C4 model [online]*, 08/10/2026, from: https://c4model.com/abstractions.
- [T31]. Brown, S. (n.d.), *Component — C4 model [online]*, 08/10/2026, from: https://c4model.com/abstractions/component.
- [T32]. Brown, S. (n.d.), *FAQ — C4 model [online]*, 08/10/2026, from: https://c4model.com/faq.
  - Các trang c4model.com không ghi năm. Có thể gộp [T24]–[T32] thành một mục "c4model.com" nếu muốn danh mục gọn hơn.
- [T33]. plantuml-stdlib (2026), *C4-PlantUML — README, GitHub repository, v2.14.0 [online]*, 08/10/2026, from: https://github.com/plantuml-stdlib/C4-PlantUML.
- [T34]. PlantUML (2026), *PlantUML Standard Library [online]*, 08/10/2026, from: https://plantuml.com/stdlib.

---

## 4. Vấn đề mở và thông tin chưa xác minh

1. **Abstract bài Rete [T5]**: ScienceDirect chặn truy cập (HTTP 403), nên chưa đọc được abstract. Dữ liệu thư mục lấy từ Crossref và trùng với chú thích trong PRR [T3]. **Không trích nội dung** bài báo; nếu cần mô tả Rete thì dẫn Drools [4] hoặc PRR [T3].
2. **Mẫu tài liệu cho bài báo tạp chí**: THESIS_STRUCTURE.md mục 7 không có mẫu. Đã đề xuất `Tác giả (năm), *Tên bài*, Tên tạp chí, tập(số), tr.` Cần GVHD duyệt.
3. **Sách chỉ xác minh thư mục**: Russell & Norvig [T6], Aho et al. [T7]. Chưa đọc nội dung, nơi xuất bản chưa xác minh. Trang Pearson của AIMA chỉ hiện bản eTextbook (2021/©2022), không thấy bản in năm 2020. Có thể bỏ [T6] vì PRR [T3] và Drools [4] đã đủ cho định nghĩa forward/backward chaining.
4. **Sách C4 của Simon Brown**: trang c4model.com liên kết tới O'Reilly "The C4 Model" (ISBN 9798341660113 trong URL). Trang O'Reilly trả HTTP 403. Một nhà sách thứ cấp ghi ISBN 9798341660120, ngày 31/07/2026. **Chưa xác minh**, nên chưa đưa vào danh mục. Sách cũ "Software Architecture for Developers" (Leanpub) chưa kiểm tra.
5. **Năm của SRE book**: trang online ghi © 2017; năm in (thường ghi 2016) chưa xác minh trên trang O'Reilly (403). Phụ đề "How Google Runs Production Systems" chưa thấy trên trang đã đọc, nên chưa đưa vào.
6. **Định nghĩa BRMS**: không tìm thấy trong đặc tả chuẩn. Nguồn [T4] là tài liệu của nhà cung cấp (IBM), chỉ dùng để minh hoạ chức năng.
7. **Ngữ nghĩa UNIQUE của đồ án khác DMN khi không có luật nào khớp**: CONTEXT.md ghi UNIQUE "*if multiple or none match, raises an evaluation error*". DMN [2, tr. 120] ghi khi không khớp thì trả default output hoặc `null`. Chương 2/3 nên nêu đây là khác biệt có chủ ý, hoặc tác giả cân nhắc chỉnh lại.
8. **COLLECT của đồ án so với DMN**: DMN Collect trả các kết quả "*in arbitrary order*" hoặc gộp bằng `+ < > #` [2, tr. 74–75]. CONTEXT.md có ví dụ "sum discounts", tương ứng C+. Cần ghi rõ đồ án hỗ trợ những phép gộp nào và có giữ thứ tự luật hay không. Nếu giữ thứ tự luật thì thực chất gần với Rule order (R) của DMN.
9. **Số trang DMN**: mọi trang DMN trong tệp (kể cả ngữ pháp 46 ở tr. 105) đã được đối chiếu với số in trên trang. Các trang PDF lệch +10 so với số in.
10. **Tài liệu Go không ghi năm** (Data Race Detector) và các trang c4model.com, JsonLogic, semver.org không ghi năm. Đã ghi "(n.d.)" hoặc năm ước lượng; cần thống nhất cách ghi với GVHD, vì mẫu Website yêu cầu năm.
11. **Phiên bản Go**: pkg.go.dev hiện go1.27.1, đặc tả go1.27. Repo **chưa có `go.mod`**, nên chưa biết đồ án dùng phiên bản Go nào. Khi viết mục 2.6/4.1 nên ghi đúng phiên bản thực dùng. `atomic.Pointer` cần Go ≥ 1.19.
12. **PlantUML stdlib C4 2.13.0 so với GitHub v2.14.0**: lệch một bản. Không ảnh hưởng nếu chỉ dùng macro cơ bản.
13. **Lời trích từ PDF**: văn bản trích từ PDF có vài chỗ chữ bị tách sai do định dạng. Đã nối lại các chữ đó và bỏ chỉ số chú thích chân trang trong câu, ngoài ra không sửa nội dung. Khi đưa vào chương nên dò lại với PDF gốc ở các trang đã ghi.
