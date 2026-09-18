# 6. Mục tiêu nghiệp vụ

| Mã | Mục tiêu | Chỉ số đo lường (Metric) | Baseline | Mục tiêu hướng tới |
| --- | --- | --- | --- | --- |
| OBJ-01 | Giảm thời gian cập nhật chính sách nghiệp vụ | Thời gian từ lúc ban hành rule đến lúc áp dụng thực tế | 2 - 5 ngày (phụ thuộc quy trình release code) | < 5 phút (nạp config động vào registry) |
| OBJ-02 | Đảm bảo tính trung lập đối với mọi domain (Domain-Agnostic) | Số lượng domain khác nhau chạy thành công trên cùng core engine | 0 | Chạy kiểm chứng thành công ít nhất 2 domain tương phản (Retail POS + Smart IoT) |
| OBJ-03 | Minh bạch hoá quá trình ra quyết định | Tỷ lệ quyết định có thể tái hiện và giải trình lý do | < 10% (phải đọc log code thủ công) | 100% quyết định có kèm Trace Summary và replay được thành Evaluation Trace đầy đủ từ Facts snapshot + Decision Version |
| OBJ-04 | Đảm bảo hiệu năng đủ dùng trong vận hành thực tế | Thời gian đánh giá 1 decision in-memory | Không đo lường riêng biệt | < 1ms với bộ 50 rules tiêu chuẩn (ngưỡng chấp nhận đạt/không đạt, không so sánh với giải pháp khác) |
