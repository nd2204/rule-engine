# 14. Ngoài phạm vi (Out of Scope)

Các tính năng và hạng mục sau đây được xác định rõ ràng là **ngoài phạm vi của Phase 1** nhằm tập trung tối đa vào độ tin cậy và hiệu năng của lõi Decision Engine:

| Nội dung | Lý do không thuộc phạm vi Phase 1 | Hướng xử lý tương lai (Phase 2+) |
| --- | --- | --- |
| **Web UI Builder / Visual Drag-and-drop Editor** | Cần ưu tiên hoàn thiện thuật toán lõi, AST schema, validation và performance trước. | Triển khai ở Phase 2 dưới dạng Web App độc lập tương tác qua API với JSON AST schema đã chuẩn hóa. |
| **Stateful Chaining / Rete Algorithm** | Engine định hướng theo mô hình Decision Table đánh giá đơn kỳ (Single-pass), không cần forward/backward inference phức tạp gây khó khăn cho việc giải trình và trace. | Xem xét nếu có domain yêu cầu hệ thống suy diễn chuyên gia phức tạp. |
| **Persistence trong lõi & Authentication Service** | Lõi BRE là pure in-memory engine, không có I/O. Persistence của Draft, Test Case, Decision Version và Latest Pointer thuộc lớp quản trị (SQLite, ADR-0006); xác thực người dùng do hệ sinh thái bao quanh (POS Backend / IoT Platform) phụ trách. | Cung cấp các adapter lưu trữ mẫu (Postgres / S3 loaders) dưới dạng extension độc lập. |
| **Decision Log phía service** | Caller tự lưu Trace Summary và Facts snapshot; nhờ Decision Version bất biến, mọi quyết định vẫn replay được. | Lưu và tra cứu lịch sử đánh giá ngay trong service. |
| **Chế độ embedded** | Phase 1 chỉ cung cấp HTTP API; Caller nhúng lõi đòi hỏi giải bài toán phân phối Decision Version. | Caller nhúng lõi và kéo Decision Version từ lớp quản trị. |
| **Biểu thức toán học phức tạp (Complex Arithmetic Expressions)** | Giữ cho condition và output mang tính declarative, minh bạch. | Consumer service tự thực hiện tính toán số học sau khi nhận danh sách ưu đãi hoặc action command từ engine. |
