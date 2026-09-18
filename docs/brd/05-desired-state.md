# 5. Trạng thái mong muốn (To-Be)

## Tầm nhìn trạng thái mới

Ứng dụng tiêu thụ (caller services như POS Backend hoặc IoT Controller) đóng gói dữ liệu đầu vào thành snapshot Facts bất biến và gửi tới Business Rule Engine. Engine nạp phiên bản Decision Definition tương ứng, đánh giá trong RAM (pure in-memory) và trả về Decision Result kèm theo Evaluation Trace đầy đủ. Engine hoàn toàn không chứa code đặc thù của domain.

## Quy trình nghiệp vụ mục tiêu

1. **Định nghĩa & Phát hành Rule**: Tác giả cấu hình Decision dưới dạng file JSON/YAML tự đóng gói (bao gồm metadata, input schema validation, hit policy và condition AST). Bộ rule được nạp vào Dynamic In-Memory Registry theo cặp `(decisionId, version)`.
2. **Gửi yêu cầu đánh giá**: Caller chuẩn bị đầy đủ Facts và gọi lệnh đánh giá (chỉ định phiên bản cụ thể hoặc lấy `latest`).
3. **Thực thi quyết định**:
   - Engine xác thực Facts với Input Schema.
   - Duyệt condition theo JSON AST với Safe Navigation (trường thiếu/null trả về `false`).
   - Áp dụng Hit Policy (`FIRST`, `UNIQUE`, `PRIORITY`, `COLLECT`).
4. **Truy vết và Vận hành**: Caller nhận kết quả quyết định và lưu/tra cứu Evaluation Trace khi cần giải trình, kiểm toán hoặc debug.

## Giá trị mang lại

- **Thời gian đưa chính sách vào vận hành (Time-to-market)**: Giảm từ vài ngày (chờ dev sửa code, build, deploy) xuống còn vài phút nhờ hot-reload runtime.
- **Minh bạch và giải trình**: 100% quyết định đều có thể tái hiện chính xác nguyên nhân thông qua Evaluation Trace.
- **Tốc độ thực thi cao**: Phản hồi sub-millisecond trong bộ nhớ, đáp ứng được giao dịch tức thời tại quầy thu ngân POS và điều khiển real-time cho IoT backend.
