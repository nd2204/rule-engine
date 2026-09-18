# 2. Bối cảnh nghiệp vụ

## Bối cảnh

Chính sách giá, chiết khấu khuyến mãi, quy định đổi trả, cấp độ phê duyệt và các quyết định điều khiển thiết bị/vận hành thường thay đổi liên tục theo thực tế kinh doanh. Tuy nhiên, các quyết định này hiện bị viết trực tiếp vào mã nguồn của từng ứng dụng (hardcoded).

## Cơ hội và động lực thay đổi

Tách decision logic ra khỏi vòng đời phát hành ứng dụng giúp đội ngũ vận hành cập nhật chính sách nhanh chóng mà không cần sửa code hay redeploy toàn bộ hệ thống. Đồng thời, việc có một engine thống nhất giúp kiểm thử, quản lý phiên bản và truy vết (audit/explain) lý do đưa ra quyết định một cách minh bạch.

## Vấn đề quyết định nghiệp vụ cần hỗ trợ

Nền tảng được thiết kế hoàn toàn domain-agnostic (không phụ thuộc vào bất kỳ domain cụ thể nào). Hai pilot domain được chọn để chứng minh tính tổng quát và năng lực chịu tải bao gồm:
1. **Retail ERP / POS**: Quyết định chương trình khuyến mãi, chiết khấu giỏ hàng (`calculate-pos-discounts`) với Hit Policy `COLLECT` hoặc `PRIORITY`.
2. **Smart IoT Irrigation**: Quyết định hành động điều khiển thiết bị tưới vi khí hậu (`determine-irrigation-action`) dựa trên dữ liệu cảm biến (độ ẩm đất, nhiệt độ, dự báo mưa) với Hit Policy `FIRST` hoặc `UNIQUE`.
