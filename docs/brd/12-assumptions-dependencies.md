# 12. Giả định, phụ thuộc và rủi ro

## Giả định (Assumptions)
- Dữ liệu Facts được ứng dụng gọi (POS Client hoặc IoT Backend Service) làm sạch và đóng gói đầy đủ trước khi truyền vào BRE.
- Các quy tắc kinh doanh cho một Decision có thể biểu diễn trọn vẹn dưới dạng biểu thức logic phân cấp (AST) kết hợp Hit Policy.

## Phụ thuộc (Dependencies)
- **Go Toolchain**: Phiên bản Go 1.22+ để tận dụng tối ưu hiệu năng và standard library.
- **Hệ thống lưu trữ ngoài**: Engine phụ thuộc vào caller trong việc nạp ban đầu các file JSON/YAML Decision Definition từ Git/Disk/Database vào Dynamic Registry.

## Rủi ro và biện pháp giảm thiểu (Risks & Mitigations)
- **Rủi ro rò rỉ bộ nhớ (Memory Bloat)** khi có quá nhiều phiên bản rule được nạp vào Dynamic Registry:
  - *Giảm thiểu*: Cung cấp API dọn dẹp hoặc giới hạn số lượng phiên bản cũ lưu trong cache (LRU / Eviction policy cho các phiên bản không còn lưu lượng truy cập).
- **Rủi ro người viết tạo vòng lặp logic hoặc điều kiện mâu thuẫn**:
  - *Giảm thiểu*: Cơ chế Decision Table và Hit Policy chuẩn hóa (`UNIQUE`, `FIRST`) phát hiện xung đột sớm và trả về cảnh báo trong quá trình nạp (validation at registration time).
