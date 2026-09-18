# Dàn ý đồ án

Dàn ý đã thống nhất cho đồ án. Viết bám theo dàn ý này và theo [THESIS_STRUCTURE.md](THESIS_STRUCTURE.md). Khi đổi mục ở đây thì đổi luôn tiêu đề trong file chương tương ứng.

## Định hướng chung

- **Luận điểm**: hệ thống đúng, ổn định và sử dụng được. Không so sánh hiệu năng với engine khác hay với bản Go hardcode; ngưỡng < 1ms chỉ là tiêu chí đạt/không đạt.
- **Ví dụ xuyên suốt**: quyết định `calculate-pos-discounts` (*hit policy* COLLECT, điều kiện `some` trên giỏ hàng) dùng cho mọi hình, bảng, đoạn mã từ Chương 2 đến Chương 4. Ba quyết định còn lại (`classify-customer-tier`, `determine-irrigation-action`, `determine-alert-level`) chỉ xuất hiện ở Chương 5.
- **Giấy phép của đồ án**: Apache-2.0 (dùng cho Bảng 1.1 và mục 4.1).
- **Phiên bản Go**: Go 1.27 (mục 2.6, 4.1 và `go.mod`).
- **Ngữ nghĩa hit policy** (CONTEXT.md): không có luật khớp ⇒ kết quả rỗng, không lỗi, với mọi hit policy; UNIQUE chỉ lỗi khi nhiều luật khớp; COLLECT trả danh sách theo thứ tự luật, không có phép gộp. Phần mềm "dựa trên" DMN, không tuyên bố "tuân thủ" DMN (DMN 1.6 §2.1).
- **Phạm vi**: Phase 1, gồm lõi BRE, lớp quản trị vòng đời, HTTP API và CLI. Web UI chỉ nêu ở mục 5.6.
- **Mô hình hoá**: dùng mô hình C4 cấp 1–3 cho cấu trúc và UML cho mô hình miền cùng hành vi (xem mục 5 của THESIS_STRUCTURE.md). Trong văn bản luôn viết "mô hình C4", còn "Chương 4" là tên chương.
- **Thứ tự viết**: MỞ ĐẦU → Chương 1 → Chương 2 → Chương 3 trước. Chương 4 và Chương 5 viết sau khi lõi và lớp quản trị chạy được.

## Dàn ý

```
MỞ ĐẦU
 1. Lý do chọn đề tài
 2. Mục đích nghiên cứu                 — sản phẩm là gì, phục vụ người soạn luật và người tích hợp
 3. Đối tượng và phạm vi nghiên cứu     — đối tượng: BRE, bảng quyết định, hit policy, vòng đời phiên bản
                                          phạm vi: Phase 1; ngoài phạm vi: Rete, Web UI, xác thực, nhật ký quyết định
 4. Ý nghĩa khoa học và thực tiễn

CHƯƠNG 1. TỔNG QUAN
 1.1. Luật nghiệp vụ trong phần mềm và vấn đề nhúng cứng vào mã nguồn   — thực trạng trong nước theo BRD 04
 1.2. Các giải pháp hiện có
   1.2.1. Drools
   1.2.2. Camunda DMN
   1.2.3. GoRules Zen
 1.3. Đánh giá, so sánh các giải pháp   — Bảng 1.1: mô hình thực thi, biểu diễn luật, quản lý phiên bản,
                                          vết giải trình, khả năng nhúng
 1.4. Vấn đề còn tồn tại và hướng giải quyết của đồ án

CHƯƠNG 2. CƠ SỞ LÝ THUYẾT
 2.1. Luật nghiệp vụ và hệ quản trị luật nghiệp vụ (BRMS)
 2.2. Chuẩn DMN
   2.2.1. Mô hình quyết định
   2.2.2. Bảng quyết định
   2.2.3. Hit policy                    — lý do chọn 4/7 hit policy (DMN 1.6 §8.2.11 cho phép tập con), dùng AST thay FEEL;
                                          giữ tên PRIORITY nhưng nói rõ: đồ án xếp theo trọng số của luật,
                                          DMN xếp theo thứ tự giá trị đầu ra
 2.3. Mô hình thực thi luật
   2.3.1. Đánh giá tuần tự
   2.3.2. Thuật toán Rete              — lý do không chọn
 2.4. Biểu diễn điều kiện an toàn bằng cây cú pháp trừu tượng (AST)
 2.5. Quản lý phiên bản và vòng đời cấu hình
 2.6. Lập trình đồng thời trong Go
 2.7. Mô hình C4 và UML trong mô tả kiến trúc phần mềm

CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
 3.1. Phân tích yêu cầu                — nguồn: BRD 07, 08 và user stories trong spec
   3.1.1. Tác nhân
   3.1.2. Yêu cầu chức năng
   3.1.3. Yêu cầu phi chức năng
 3.2. Mô hình miền                     — sơ đồ lớp UML, bám CONTEXT.md
 3.3. Kiến trúc tổng thể
   3.3.1. Sơ đồ ngữ cảnh hệ thống      — mô hình C4 cấp 1
   3.3.2. Sơ đồ container              — mô hình C4 cấp 2; một container BRE Service (ADR-0006)
 3.4. Thiết kế lõi BRE                 — mở đầu bằng sơ đồ component
   3.4.1. Tệp định nghĩa quyết định
   3.4.2. Đánh giá điều kiện
   3.4.3. Hit policy
   3.4.4. Vết đánh giá
   3.4.5. Bộ đăng ký quyết định        — kèm sơ đồ tuần tự Evaluate
 3.5. Thiết kế lớp quản trị vòng đời   — mở đầu bằng sơ đồ component
   3.5.1. Bản nháp và ca kiểm thử      — kèm sơ đồ trạng thái
   3.5.2. Mô phỏng
   3.5.3. Phát hành và rollback        — kèm sơ đồ tuần tự Publish
   3.5.4. Lưu trữ dữ liệu
 3.6. Thiết kế giao diện tích hợp (HTTP API, CLI)

CHƯƠNG 4. XÂY DỰNG HỆ THỐNG
 4.1. Môi trường và công cụ phát triển
 4.2. Cấu trúc mã nguồn
 4.3. Hiện thực lõi BRE
 4.4. Hiện thực lớp quản trị
 4.5. Hiện thực HTTP API và CLI
 4.6. Thiết kế kiểm thử                — chỉ trình bày cách kiểm thử; kết quả để ở Chương 5

CHƯƠNG 5. KẾT QUẢ VÀ BÀN LUẬN
 5.1. Kịch bản thực nghiệm             — 2 domain, 4 quyết định, đủ 4 hit policy
 5.2. Kết quả về tính đúng đắn         — tỷ lệ ca kiểm thử đạt
 5.3. Kết quả về tính ổn định          — race detector khi nạp nóng; dữ kiện thiếu/null không gây panic;
                                          ngưỡng < 1ms (đạt/không đạt)
 5.4. Kết quả về khả năng sử dụng      — kịch bản thay đổi chính sách: bản nháp → mô phỏng → phát hành
                                          → rollback, đếm số bước và thời gian, đặt cạnh sửa code → build → deploy
 5.5. Bàn luận
 5.6. Hạn chế và hướng phát triển      — Web UI, ứng dụng gọi nhúng lõi, Rete

KẾT LUẬN                               — chỉ tóm tắt kết quả, không bàn luận
TÀI LIỆU THAM KHẢO
PHỤ LỤC                                — tệp định nghĩa quyết định đầy đủ, mã nguồn dài, kết quả kiểm thử chi tiết
```

## File chương

| File | Nội dung |
|------|----------|
| `00-phan-dau.md` | Phần đầu |
| `01-mo-dau.md` | MỞ ĐẦU |
| `02-chuong-1-tong-quan.md` | Chương 1 |
| `03-chuong-2-co-so-ly-thuyet.md` | Chương 2 |
| `04-chuong-3-phan-tich-thiet-ke.md` | Chương 3 |
| `05-chuong-4-xay-dung-he-thong.md` | Chương 4 |
| `06-chuong-5-ket-qua.md` | Chương 5 |
| `90-ket-luan.md`, `91-tai-lieu-tham-khao.md`, `92-phu-luc.md` | Phần cuối |

## Hình dự kiến cho Chương 3

Số hình đánh theo thứ tự xuất hiện; khi chèn thêm hình thì đánh lại số.

| Mục | Hình | Loại |
|-----|------|------|
| 3.2 | Mô hình miền | Sơ đồ lớp UML |
| 3.3.1 | Sơ đồ ngữ cảnh hệ thống | Mô hình C4 cấp 1 |
| 3.3.2 | Sơ đồ container | Mô hình C4 cấp 2 |
| 3.4 | Sơ đồ component lõi BRE | Mô hình C4 cấp 3 |
| 3.4.5 | Luồng đánh giá một quyết định | Sơ đồ tuần tự UML |
| 3.5 | Sơ đồ component lớp quản trị | Mô hình C4 cấp 3 |
| 3.5.1 | Vòng đời bản nháp và phiên bản quyết định | Sơ đồ trạng thái UML |
| 3.5.3 | Luồng phát hành | Sơ đồ tuần tự UML |
