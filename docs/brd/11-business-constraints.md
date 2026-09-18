# 11. Ràng buộc nghiệp vụ

| Mã | Loại ràng buộc | Nội dung chi tiết |
| --- | --- | --- |
| CON-01 | Kiến trúc hệ thống | Engine phải hoạt động độc lập dưới dạng Go library (hoặc nhúng vào microservice/edge daemon), không được mang theo dependency nặng của framework bên ngoài. |
| CON-02 | An toàn bảo mật | Tuyệt đối không cho phép thực thi mã chuỗi tùy ý (không dùng `eval`, reflection dynamic invocation tự do) để chống hoàn toàn các cuộc tấn công Arbitrary Code Execution (ACE). Mọi điều kiện phải qua AST có kiểm soát. |
| CON-03 | Quản lý bộ nhớ | In-memory registry phải đảm bảo an toàn đa luồng (thread-safe / goroutine-safe) khi đọc đồng thời và nạp hot-reload phiên bản mới. |
| CON-04 | Tương thích mở rộng | Định dạng Decision Definition và AST Condition phải được thiết kế để có thể serialize 100% sang JSON/YAML, đảm bảo tương thích hoàn toàn với Web UI Builder / Visual Editor ở Phase 2. |
