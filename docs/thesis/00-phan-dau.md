# LỜI CẢM ƠN

<!-- Sinh viên tự viết. Agent không soạn thay. -->

# MỤC LỤC

<!-- Chỉ ghi tiêu đề, không ghi số trang. Đồng bộ với tiêu đề trong các file chương và DAN-Y.md. -->

- LỜI CẢM ƠN
- MỤC LỤC
- DANH MỤC CHỮ VIẾT TẮT
- DANH MỤC BẢNG
- DANH MỤC HÌNH
- DANH MỤC ĐOẠN MÃ
- MỞ ĐẦU
  - 1\. Lý do chọn đề tài
  - 2\. Mục đích nghiên cứu
  - 3\. Đối tượng và phạm vi nghiên cứu
  - 4\. Ý nghĩa khoa học và thực tiễn
- CHƯƠNG 1. TỔNG QUAN
  - 1.1. Luật nghiệp vụ trong phần mềm và vấn đề nhúng cứng vào mã nguồn
  - 1.2. Các giải pháp hiện có
    - 1.2.1. Drools
    - 1.2.2. Camunda DMN
    - 1.2.3. GoRules Zen
  - 1.3. Đánh giá, so sánh các giải pháp
  - 1.4. Vấn đề còn tồn tại và hướng giải quyết của đồ án
- CHƯƠNG 2. CƠ SỞ LÝ THUYẾT
  - 2.1. Luật nghiệp vụ và hệ quản trị luật nghiệp vụ
  - 2.2. Chuẩn DMN
    - 2.2.1. Mô hình quyết định
    - 2.2.2. Bảng quyết định
    - 2.2.3. Hit policy
  - 2.3. Mô hình thực thi luật
    - 2.3.1. Đánh giá tuần tự
    - 2.3.2. Thuật toán Rete
  - 2.4. Biểu diễn điều kiện an toàn bằng cây cú pháp trừu tượng
  - 2.5. Quản lý phiên bản và vòng đời cấu hình
  - 2.6. Lập trình đồng thời trong Go
  - 2.7. Mô hình C4 và UML trong mô tả kiến trúc phần mềm
- CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
  - 3.1. Phân tích yêu cầu
    - 3.1.1. Tác nhân
    - 3.1.2. Yêu cầu chức năng
    - 3.1.3. Yêu cầu phi chức năng
  - 3.2. Mô hình miền
  - 3.3. Kiến trúc tổng thể
    - 3.3.1. Sơ đồ ngữ cảnh hệ thống
    - 3.3.2. Sơ đồ container
  - 3.4. Thiết kế lõi BRE
    - 3.4.1. Tệp định nghĩa quyết định
    - 3.4.2. Đánh giá điều kiện
    - 3.4.3. Hit policy
    - 3.4.4. Vết đánh giá
    - 3.4.5. Bộ đăng ký quyết định
  - 3.5. Thiết kế lớp quản trị vòng đời
    - 3.5.1. Bản nháp và ca kiểm thử
    - 3.5.2. Mô phỏng
    - 3.5.3. Phát hành và rollback
    - 3.5.4. Lưu trữ dữ liệu
  - 3.6. Thiết kế giao diện tích hợp
- CHƯƠNG 4. XÂY DỰNG HỆ THỐNG
  - 4.1. Môi trường và công cụ phát triển
  - 4.2. Cấu trúc mã nguồn
  - 4.3. Hiện thực lõi BRE
  - 4.4. Hiện thực lớp quản trị
  - 4.5. Hiện thực HTTP API và CLI
  - 4.6. Thiết kế kiểm thử
- CHƯƠNG 5. KẾT QUẢ VÀ BÀN LUẬN
  - 5.1. Kịch bản thực nghiệm
  - 5.2. Kết quả về tính đúng đắn
  - 5.3. Kết quả về tính ổn định
  - 5.4. Kết quả về khả năng sử dụng
  - 5.5. Bàn luận
  - 5.6. Hạn chế và hướng phát triển
- KẾT LUẬN
- TÀI LIỆU THAM KHẢO
- PHỤ LỤC

# DANH MỤC CHỮ VIẾT TẮT

<!-- Xếp theo ABC. Chỉ ghi chữ viết tắt thực sự xuất hiện trong đồ án; thêm khi chương mới dùng chữ viết tắt mới. -->

| Chữ viết tắt | Viết đầy đủ | Nghĩa tiếng Việt |
|--------------|-------------|------------------|
| API | Application Programming Interface | Giao diện lập trình ứng dụng |
| AST | Abstract Syntax Tree | Cây cú pháp trừu tượng |
| BRE | Business Rule Engine | Bộ máy thực thi luật nghiệp vụ |
| BRMS | Business Rule Management System | Hệ quản trị luật nghiệp vụ |
| CLI | Command-Line Interface | Giao diện dòng lệnh |
| CWE | Common Weakness Enumeration | Danh mục điểm yếu phần mềm |
| DMN | Decision Model and Notation | Chuẩn mô hình và ký hiệu quyết định |
| DRL | Drools Rule Language | Ngôn ngữ luật của Drools |
| FEEL | Friendly Enough Expression Language | Ngôn ngữ biểu thức của chuẩn DMN |
| HTTP | HyperText Transfer Protocol | Giao thức truyền siêu văn bản |
| I/O | Input/Output | Vào/ra |
| IoT | Internet of Things | Internet vạn vật |
| JDM | JSON Decision Model | Mô hình quyết định dạng JSON của GoRules |
| JSON | JavaScript Object Notation | Định dạng trao đổi dữ liệu JSON |
| JVM | Java Virtual Machine | Máy ảo Java |
| OMG | Object Management Group | Tổ chức chuẩn hoá Object Management Group |
| POS | Point of Sale | Điểm bán hàng tại quầy |
| PRR | Production Rule Representation | Chuẩn biểu diễn luật sản xuất |
| SBVR | Semantics of Business Vocabulary and Business Rules | Chuẩn ngữ nghĩa từ vựng và luật nghiệp vụ |
| UML | Unified Modeling Language | Ngôn ngữ mô hình hoá thống nhất |
| YAML | YAML Ain't Markup Language | Định dạng tuần tự hoá dữ liệu YAML |

# DANH MỤC BẢNG

<!-- Số + tên, theo thứ tự xuất hiện. -->

- Bảng 1.1. So sánh các giải pháp hiện có
- Bảng 2.1. Bảng quyết định minh hoạ cho quyết định calculate-pos-discounts (hit policy COLLECT)
- Bảng 2.2. Các hit policy trong chuẩn DMN 1.6
- Bảng 2.3. So sánh đánh giá tuần tự và suy diễn tiến theo thuật toán Rete
- Bảng 2.4. Các loại sơ đồ sử dụng trong đồ án
- Bảng 3.1. Các tác nhân của hệ thống
- Bảng 3.2. Yêu cầu chức năng
- Bảng 3.3. Yêu cầu phi chức năng
- Bảng 3.4. Cú pháp ô của bảng quyết định và nút AST tương ứng
- Bảng 3.5. Hành vi của các hit policy theo số luật khớp
- Bảng 3.6. Thông tin trong bản tóm tắt vết và vết đánh giá đầy đủ
- Bảng 3.7. Cấu trúc cơ sở dữ liệu của lớp quản trị
- Bảng 3.8. Các điểm cuối của API
- Bảng 3.9. Các mã lỗi chính của API
- Bảng 3.10. Các lệnh của công cụ dòng lệnh bre

# DANH MỤC HÌNH

<!-- Số + tên, theo thứ tự xuất hiện. -->

- Hình 2.1. Cây cú pháp trừu tượng của điều kiện trong Đoạn mã 2.1
- Hình 3.1. Mô hình miền của hệ thống
- Hình 3.2. Sơ đồ ngữ cảnh hệ thống theo mô hình C4
- Hình 3.3. Sơ đồ container theo mô hình C4
- Hình 3.4. Sơ đồ component của lõi BRE theo mô hình C4
- Hình 3.5. Sơ đồ tuần tự của luồng đánh giá một quyết định
- Hình 3.6. Sơ đồ component của lớp quản trị vòng đời theo mô hình C4
- Hình 3.7. Sơ đồ trạng thái của bản nháp và phiên bản quyết định
- Hình 3.8. Sơ đồ tuần tự của luồng phát hành

# DANH MỤC ĐOẠN MÃ

<!-- Số + tên, theo thứ tự xuất hiện. -->

- Đoạn mã 2.1. Một điều kiện của quyết định calculate-pos-discounts theo cú pháp JsonLogic
- Đoạn mã 3.1. Giao diện công khai của lõi BRE
- Đoạn mã 3.2. Tệp định nghĩa của quyết định calculate-pos-discounts
- Đoạn mã 3.3. Giải thuật đánh giá một quyết định đã biên dịch
- Đoạn mã 3.4. Yêu cầu đánh giá quyết định calculate-pos-discounts
- Đoạn mã 3.5. Kết quả đánh giá tương ứng với Đoạn mã 3.4 (giá trị minh hoạ)
