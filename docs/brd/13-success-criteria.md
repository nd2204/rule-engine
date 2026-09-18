# 13. Tiêu chí thành công

Dự án Business Rule Engine (Phase 1) được coi là thành công khi đáp ứng đầy đủ các tiêu chí sau:

## 1. Tiêu chí chức năng (Functional Verification)
- [ ] Chạy thành công và đầy đủ unit/integration tests cho cả 2 Pilot Domains:
  - **Retail POS**: Quyết định chiết khấu giỏ hàng phức tạp với Hit Policy `COLLECT` và toán tử duyệt mảng (`some` item thuộc nhóm chỉ định).
  - **Smart IoT Irrigation**: Quyết định lệnh đóng/mở van tưới nước với Hit Policy `FIRST` và điều kiện cảm biến vi khí hậu.
- [ ] Hỗ trợ đầy đủ 4 Hit Policy: `FIRST`, `UNIQUE`, `PRIORITY`, `COLLECT`.
- [ ] Xuất ra đối tượng `EvaluationTrace` chi tiết đến từng điều kiện con và thời gian chạy.
- [ ] Dynamic Registry hỗ trợ nạp nóng (hot-reload) phiên bản mới và truy xuất theo `version` hoặc `latest` mà không gián đoạn goroutines đang đọc.

## 2. Tiêu chí phi chức năng (Non-Functional Benchmarks)
- [ ] **Độ trễ (Latency)**: Thời gian đánh giá 1 decision in-memory < 1ms (đo lường qua Go benchmark tiêu chuẩn). Đây là ngưỡng chấp nhận đạt/không đạt; đề tài không so sánh hiệu năng với giải pháp khác.
- [ ] **Ổn định (Stability)**: Không có data race khi đánh giá đồng thời trong lúc nạp nóng phiên bản mới (kiểm tra bằng race detector).
- [ ] **An toàn (Safety)**: 0% nguy cơ code injection; xử lý an toàn khi Facts bị thiếu/null mà không xảy ra runtime panic.
- [ ] **Sẵn sàng cho Phase 2 (Readiness)**: Mô hình schema JSON/YAML chuẩn hóa 100%, sẵn sàng cho việc cắm Web UI Builder / Visual Drag-and-drop Editor sau này.
