# Business Requirements Document (BRD)

Thư mục này mô tả **vấn đề, nhu cầu và quyết định nghiệp vụ** mà Business Rule Engine cần giải quyết. BRD không quyết định công nghệ, kiến trúc, database, API, DSL hay cách hiện thực rule engine; các nội dung đó thuộc SRS và tài liệu thiết kế kỹ thuật.

## Cấu trúc

| Tài liệu | Mục đích |
| --- | --- |
| [01-document-overview.md](01-document-overview.md) | Phạm vi tài liệu, thuật ngữ và tài liệu liên quan. |
| [02-business-context.md](02-business-context.md) | Bối cảnh tổ chức, thị trường và lý do cần thay đổi. |
| [03-business-problem.md](03-business-problem.md) | Vấn đề hiện tại, nguyên nhân, tác động và mức độ ưu tiên. |
| [04-current-state.md](04-current-state.md) | Quy trình và cách quản lý rule ở trạng thái As-Is. |
| [05-desired-state.md](05-desired-state.md) | Trạng thái To-Be và giá trị mong muốn. |
| [06-business-objectives.md](06-business-objectives.md) | Mục tiêu có thể đo lường và chỉ số thành công. |
| [07-stakeholders.md](07-stakeholders.md) | Stakeholder, vai trò, quyền lợi và trách nhiệm. |
| [08-business-requirements.md](08-business-requirements.md) | Các yêu cầu nghiệp vụ cấp cao, ưu tiên và tiêu chí chấp nhận. |
| [09-business-rules.md](09-business-rules.md) | Danh mục rule nghiệp vụ minh hoạ và chính sách quản trị rule. |
| [10-business-decision-model.md](10-business-decision-model.md) | Input → decision → output; đây là trung tâm của BRD. |
| [11-business-constraints.md](11-business-constraints.md) | Ràng buộc pháp lý, vận hành, ngân sách, thời gian và quyền hạn. |
| [12-assumptions-dependencies.md](12-assumptions-dependencies.md) | Giả định, phụ thuộc và rủi ro cần xác thực. |
| [13-success-criteria.md](13-success-criteria.md) | Cách đánh giá đề tài/sản phẩm đã thành công. |
| [14-out-of-scope.md](14-out-of-scope.md) | Các nội dung không thuộc phạm vi để tránh mở rộng ngoài kiểm soát. |

## Trình tự biên soạn đề xuất

1. `02` đến `05`: hiểu bối cảnh, vấn đề và trạng thái mong muốn.
2. `10`: xác định business decision đầu tiên để làm use case xuyên suốt.
3. `06` đến `09`: chốt mục tiêu, stakeholder, requirement và business rule.
4. `11` đến `14`: xác định giới hạn, giả định và tiêu chí hoàn thành.

Sau khi BRD được thống nhất, mỗi business requirement sẽ được truy vết sang functional requirement, system behavior và acceptance criteria trong SRS.
