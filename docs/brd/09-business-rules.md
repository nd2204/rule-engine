# 9. Business Rules

Danh mục các quy tắc vận hành và ràng buộc cốt lõi áp dụng cho chính Business Rule Engine:

## BRE-R01: Tính bất biến của Facts (Fact Immutability)
Trong suốt quá trình đánh giá Decision, Engine không được phép thay đổi, gán đè, hoặc làm đột biến (mutate) cấu trúc dữ liệu của Facts do caller cung cấp.

## BRE-R02: Xác định đơn trị và giải quyết xung đột (Conflict Resolution Determinism)
Mỗi Decision Table bắt buộc phải khai báo một Hit Policy hợp lệ (`FIRST`, `UNIQUE`, `PRIORITY`, `COLLECT`).
- Đối với `UNIQUE`: Nếu có từ 2 rules trở lên cùng thỏa mãn, engine phải ngắt thực thi và trả về mã lỗi `HIT_POLICY_UNIQUE_VIOLATION`.
- Đối với `PRIORITY`: Khi có nhiều rules cùng thỏa mãn, rule có giá trị `priority` số nguyên lớn nhất sẽ được chọn làm output duy nhất. Nếu trùng priority, rule xuất hiện trước theo thứ tự khai báo sẽ được ưu tiên.
- Đối với `COLLECT`: Output trả về là một mảng tuần tự chứa danh sách action payload của tất cả các rule thỏa mãn theo thứ tự duyệt.

## BRE-R03: Tính an toàn khi thiếu dữ liệu (Null & Missing Fact Safety)
Khi một biểu thức điều kiện truy xuất tới một đường dẫn thuộc tính không tồn tại hoặc có giá trị `null` trong Facts:
- Biểu thức so sánh trực tiếp với giá trị khác sẽ trả về `false` (ngoại trừ phép so sánh bằng `null`).
- Engine không được phép panic/crash. Sự kiện thiếu thuộc tính này bắt buộc phải được ghi lại trong trường `warnings` của Evaluation Trace.

## BRE-R04: Độc lập I/O trong chu trình đánh giá (Zero I/O Policy)
Toàn bộ dữ liệu phục vụ việc quyết định phải nằm sẵn trong bộ nhớ RAM (được truyền qua Facts hoặc cấu hình sẵn trong Decision Definition). Engine cấm gọi network, cấm đọc disk, cấm truy vấn database trong phương thức `Evaluate()`.
