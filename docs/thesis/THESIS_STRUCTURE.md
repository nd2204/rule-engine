# Quy định trình bày Đồ án tốt nghiệp (EPU)

Bộ quy định bắt buộc khi viết đồ án bằng Markdown trong `docs/thesis/`. Nguồn: *Phụ lục 2 – Hình thức, quy cách, cấu trúc trình bày quyển ĐA/KLTN*, Trường Đại học Điện lực. Khi quy định này khác với khung chung của skill `thesis-writing`, **quy định này thắng**.

Markdown là bản nguồn; bản nộp được xuất sang `.docx` bằng Pandoc (xem mục 10). Mọi cú pháp phải đọc được trực tiếp trên GitHub/VS Code và xuất được bằng Pandoc không cần filter.

## 1. Bố cục file

Mỗi phần một file, tiền tố số quyết định thứ tự:

| File | Nội dung |
|------|----------|
| `00-phan-dau.md` | Lời cảm ơn, Mục lục, Danh mục chữ viết tắt, Danh mục bảng, Danh mục hình, Danh mục đoạn mã |
| `01-mo-dau.md` | MỞ ĐẦU |
| `02-chuong-1-tong-quan.md` | CHƯƠNG 1. TỔNG QUAN |
| `03-chuong-2-….md` … | Các chương giữa |
| `0x-chuong-n-ket-qua.md` | Chương cuối: KẾT QUẢ (gồm cả phần bàn luận) |
| `90-ket-luan.md` | KẾT LUẬN |
| `91-tai-lieu-tham-khao.md` | TÀI LIỆU THAM KHẢO |
| `92-phu-luc.md` | PHỤ LỤC |
| `figures/` | Nguồn PlantUML `.puml` và ảnh `.svg` đã xuất |

**Không tạo trong Markdown**: bìa cứng, bìa phụ, nhận xét của GVHD, nhận xét phản biện, nhiệm vụ ĐA/KLTN (biểu mẫu có chữ ký, làm trong Word). **Tóm tắt** ĐA/KLTN (8–16 trang/slide) là tài liệu riêng, ngoài phạm vi các file này.

## 2. Khung nội dung

- **Phần đầu**: Lời cảm ơn để trống — sinh viên tự viết, agent không soạn thay. Mục lục chỉ liệt kê tiêu đề, **không ghi số trang**.
- **MỞ ĐẦU**: ngắn gọn — lý do chọn đề tài, mục đích, đối tượng và phạm vi nghiên cứu, ý nghĩa khoa học và thực tiễn.
- **CHƯƠNG 1. TỔNG QUAN**: phân tích, đánh giá các công trình/giải pháp đã có trong và ngoài nước liên quan mật thiết đến đề tài; nêu những vấn đề còn tồn tại; chỉ ra vấn đề đồ án tập trung giải quyết.
- **Các chương giữa** (tên tự đặt, ví dụ Cơ sở lý thuyết; Phân tích và thiết kế): cơ sở lý thuyết, giả thuyết, phương pháp đã sử dụng; mô tả công việc đã tiến hành và số liệu thực nghiệm.
- **Chương KẾT QUẢ**: kết quả và **bàn luận**. Bàn luận phải căn cứ vào số liệu thu được hoặc đối chiếu với kết quả của tác giả khác qua tài liệu tham khảo. Phần *Discussion* của skill nằm ở đây.
- **KẾT LUẬN**: trình bày kết quả một cách ngắn gọn, **không có lời bàn và bình luận thêm**.
- **TÀI LIỆU THAM KHẢO**: chỉ gồm tài liệu được trích dẫn, sử dụng, đề cập trong bài.
- **PHỤ LỤC** (nếu có): số liệu, biểu mẫu, mã nguồn dài, bảng hỏi nguyên bản (không tóm tắt, không sửa), tính toán mẫu. Phụ lục không được dày hơn phần chính.

## 3. Tiêu đề và đánh số mục

Số được **viết tay** trong tiêu đề; không dùng `--number-sections`.

| Cấp | Markdown | Ví dụ |
|-----|----------|-------|
| Chương / phần không đánh số | `#` | `# CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ`, `# MỞ ĐẦU`, `# KẾT LUẬN` |
| Mục | `##` | `## 3.1. Kiến trúc tổng thể` |
| Tiểu mục | `###` | `### 3.1.2. Bộ đăng ký quyết định` |
| Tiểu mục cấp 4 | `####` | `#### 3.1.2.1. Cơ chế khóa` |

- Tối đa 4 chữ số; **không dùng `#####`** — chia nhỏ hơn thì dùng đoạn mở đầu bằng chữ in đậm hoặc danh sách.
- Mỗi nhóm tiểu mục có **ít nhất hai** tiểu mục: có `2.1.1.` thì phải có `2.1.2.`.
- Số luôn có dấu chấm cuối: `1.1.`, `1.1.1.`.
- Chèn hoặc xóa mục ⇒ đánh lại số các mục sau và cập nhật Mục lục cùng mọi tham chiếu.

## 4. Bảng, hình, đoạn mã, công thức

Đánh số gắn với chương: `Hình 3.4` là hình thứ 4 của Chương 3. Bốn loại đánh số **độc lập** với nhau.

**Bảng** — tiêu đề **phía trên**:

```markdown
**Bảng 3.1.** So sánh các hit policy

| Hit policy | Số luật khớp | Kết quả |
|------------|--------------|---------|
| ...        | ...          | ...     |

Nguồn: Tổng hợp từ [4]
```

**Hình** — tiêu đề **phía dưới**:

```markdown
![](figures/hinh-3-4-kien-truc-tong-the.svg)

**Hình 3.4.** Kiến trúc tổng thể của hệ thống
```

**Đoạn mã** — tiêu đề **phía trên**, khối mã có khai báo ngôn ngữ:

````markdown
**Đoạn mã 3.1.** Đánh giá một quyết định với hit policy FIRST

```ts
...
```
````

**Công thức** — mọi công thức đều đánh số, đặt trong ngoặc đơn bên phải bằng `\tag`:

```markdown
$$ T = \sum_{i=1}^{n} t_i \tag{4.1} $$

trong đó $T$ là tổng thời gian đánh giá (ms), $t_i$ là thời gian đánh giá luật thứ $i$ (ms).
```

Nhóm công thức cùng số đánh dạng `(4.1.1)`, `(4.1.2)`. Ký hiệu được giải thích ở lần xuất hiện đầu tiên, kèm đơn vị.

Quy tắc chung:

- Hình/bảng lấy hoặc chuyển thể từ nguồn khác phải có dòng `Nguồn: … [n]` và nguồn đó phải có trong Tài liệu tham khảo.
- Đặt ngay sau đoạn văn nhắc tới nó lần đầu.
- Trong văn bản phải gọi đúng số: "… được nêu trong Bảng 4.1", "(xem Hình 3.2)". **Không** viết "bảng dưới đây", "hình sau".
- Đoạn mã trong phần chính khoảng **≤ 20 dòng**; dài hơn thì đưa vào Phụ lục và tham chiếu tới đó.
- Mỗi bảng/hình/đoạn mã được liệt kê (số + tên) trong danh mục tương ứng ở `00-phan-dau.md`.

## 5. Hình vẽ (PlantUML)

- Nguồn và ảnh xuất cùng nằm trong `docs/thesis/figures/`, cùng tên: `hinh-3-4-kien-truc-tong-the.puml` → `hinh-3-4-kien-truc-tong-the.svg`.
- Mỗi file `.puml` có `skinparam monochrome true` để in mực đen, sao chụp được.
- Xuất: `plantuml -tsvg docs/thesis/figures/<ten>.puml`.
- Chữ trong hình không quá nhỏ so với cỡ chữ văn bản; tiêu đề hình nằm trong Markdown, không vẽ vào ảnh.
- Đổi số hình ⇒ đổi tên cả hai file và đường dẫn trong Markdown.
- Nhãn chứa ký tự Creole phải viết bằng mã Unicode: `==` → `<U+003D><U+003D>`, dấu nháy kép → `<U+0022>` (nếu không, `==` thành đường kẻ ngang).

### Sơ đồ kiến trúc theo mô hình C4

- Cấu trúc hệ thống vẽ theo mô hình C4, cấp 1–3 (Context, Container, Component); không vẽ cấp Code — mô hình miền dùng sơ đồ lớp UML.
- Hành vi dùng UML: sơ đồ tuần tự cho luồng xử lý, sơ đồ trạng thái cho vòng đời; không dùng sơ đồ Dynamic của C4.
- Dùng thư viện có sẵn trong PlantUML để render không cần mạng: `!include <C4/C4_Context>`, `<C4/C4_Container>`, `<C4/C4_Component>`. Không `!include` URL.
- Vẫn bắt buộc `skinparam monochrome true` (ghi sau dòng `!include`) để bỏ màu mặc định của C4-PlantUML.
- Lõi BRE và lớp quản trị là hai nhóm component trong **một** container BRE Service (ADR-0006), không vẽ thành hai container.
- Trong văn bản luôn viết "mô hình C4", không viết tắt "C4", để không nhầm với "Chương 4".

## 6. Trích dẫn

- Trích dẫn trong câu dạng số: `[n]`; nhiều nguồn `[2], [5]`; trích nguyên văn ghi kèm trang `[n, tr. 12]`.
- Mọi ý kiến, khái niệm, bảng, hình, công thức, ý tưởng không phải của tác giả đều phải trích nguồn — thiếu chú dẫn thì đồ án không được duyệt bảo vệ.
- Trích có chọn lọc, không dồn vào một tài liệu; trước và sau đoạn trích phải có nhận định của tác giả. Không trích kiến thức phổ biến.
- Trích ngắn (< 2 câu hoặc < 4 dòng): trong ngoặc kép, in nghiêng — `"*…*" [n, tr. x]`.
- Trích dài: đoạn riêng bằng blockquote `>`, không dùng ngoặc kép, ghi `[n, tr. x]` cuối đoạn.
- Trích qua tài liệu thứ cấp: ghi rõ "dẫn theo [n]"; tài liệu gốc **không** đưa vào danh mục.
- Nội dung trích nguyên văn phải chính xác tuyệt đối — agent không được tự diễn đạt lại rồi đặt trong ngoặc kép.

## 7. Tài liệu tham khảo (`91-tai-lieu-tham-khao.md`)

Viết tay, không dùng BibTeX/CSL. Số `[n]` đánh **liên tục** qua các nhóm, theo thứ tự nhóm:

1. Văn bản hành chính nhà nước
2. Sách tiếng Việt
3. Sách tiếng nước ngoài
4. Báo, tạp chí
5. Các trang web
6. Tài liệu gốc của cơ quan thực tập

Bỏ nhóm không có tài liệu. Trang web không ghi năm: viết `(không rõ năm)`, không tự đoán năm (cần GVHD xác nhận). Tài liệu nước ngoài giữ nguyên văn, không phiên âm, không dịch. Mọi `[n]` trong bài phải có trong danh mục và ngược lại.

Mẫu (tên tài liệu in nghiêng):

| Loại | Mẫu |
|------|-----|
| Sách | `[n]. Tác giả (năm), *Tên sách*. Nhà xb, Nơi xb.` |
| Sách tái bản | `[n]. Tác giả (năm), *Tên sách*. 2nd ed, Nhà xb, Nơi xb.` |
| Chương sách | `[n]. Tác giả (năm), *Tên chương*. In: Tác giả sách (eds), *Tên sách*. Nhà xb, Nơi xb, pp. đầu–cuối.` |
| Sách chủ biên | `[n]. Tác giả (ed/Chủ biên) (năm), *Tên sách*. Nhà xb, Nơi xb.` |
| Sách điện tử | `[n]. Tác giả (năm), *Tên sách [online]*, Nhà xb, viewed <ngày truy cập>, from: <URL>` |
| Luận văn/luận án | `[n]. Tác giả (năm), *Tên đề tài*. Thesis (Master/PhD), Khoa, Trường.` |
| Website | `[n]. Tác giả (năm), *Tên tài liệu [online]*, <ngày truy cập>, from: <URL>.` |
| Báo | `[n]. Tác giả (năm), *Tên bài*, Tên báo, Mục, dd/mm/yyyy.` |
| Bài báo khoa học (tạp chí) | `[n]. Tác giả (năm), *Tên bài*, Tên tạp chí, tập(số), tr. đầu–cuối.` — *mẫu tự đề xuất, cần GVHD xác nhận* |

## 8. Ngôn ngữ, thuật ngữ, chữ viết tắt

- Viết bằng tiếng Việt, văn phong khoa học, ngắn gọn, rõ ràng.
- **Khái niệm phổ thông**: dịch sang tiếng Việt, lần đầu ghi tiếng Anh trong ngoặc — "luật nghiệp vụ (business rule)".
- **Thuật ngữ chuyên ngành không có bản dịch quen thuộc**: giữ tiếng Anh, lần đầu in nghiêng kèm giải thích — "*hit policy* (chiến lược tổng hợp khi nhiều luật cùng khớp)". Các lần sau viết thường, không in nghiêng.
- **Chữ viết tắt**: chỉ viết tắt từ/thuật ngữ dùng nhiều lần; không viết tắt cụm dài, mệnh đề hoặc cụm ít xuất hiện. Lần đầu viết đầy đủ kèm chữ viết tắt trong ngoặc đơn — "Business Rule Engine (BRE)". Mọi chữ viết tắt có trong Danh mục chữ viết tắt, xếp theo ABC.
- Một khái niệm chỉ có một tên trong toàn đồ án — dùng đúng bảng thuật ngữ dưới đây.

### Bảng thuật ngữ

Bám theo [CONTEXT.md](../../CONTEXT.md); cập nhật bảng này khi CONTEXT.md thêm hoặc đổi thuật ngữ.

| CONTEXT.md | Trong đồ án |
|------------|-------------|
| Business Rule Engine | Business Rule Engine (BRE) |
| Fact | dữ kiện |
| Condition | điều kiện |
| Action / Output | kết quả đầu ra |
| Rule | luật |
| Decision | quyết định |
| Hit Policy | *hit policy* |
| Evaluation Trace | vết đánh giá |
| Trace Summary | bản tóm tắt vết |
| Rule Set / Decision Table | tập luật / bảng quyết định |
| Decision Registry | bộ đăng ký quyết định |
| Decision Definition Artifact | tệp định nghĩa quyết định |
| Input Schema Validation | kiểm tra lược đồ đầu vào |
| Decision Result | kết quả quyết định |
| Decision Version | phiên bản quyết định |
| Latest Pointer | con trỏ *latest* |
| Rollback | *rollback* (quay lui phiên bản) |
| Draft | bản nháp |
| Published | đã phát hành |
| Stale Draft | bản nháp lỗi thời |
| Breaking Change | *breaking change* (thay đổi phá vỡ tương thích) |
| Simulation | mô phỏng |
| Test Case | ca kiểm thử |
| Rule Author | người soạn luật |
| Integrator | người tích hợp |
| Caller | ứng dụng gọi |
| Hot reload | *hot reload* |

## 9. Độ dài

Markdown không có trang; dùng ước lượng mềm **1 trang ≈ 300 từ** (Times New Roman 13, giãn dòng 1,5, A4):

- Phần chính (MỞ ĐẦU → KẾT LUẬN) ≥ 40 trang ≈ **≥ 12.000 từ**, tính cả bảng và hình.
- Phụ lục ít chữ hơn phần chính.

Số trang thật phải kiểm tra lại trên bản `.docx` đã xuất.

## 10. Quy định không áp dụng được trong Markdown

Áp dụng khi xuất Pandoc qua `reference.docx`; agent không cố mô phỏng trong Markdown:

- Font Times New Roman, cỡ 13, Unicode, mật độ chữ bình thường.
- Giãn dòng 1,5 lines; lùi đầu dòng 1 cm.
- Lề trên 2,5 cm, dưới 2,5 cm, trái 3,5 cm, phải 2 cm.
- Số trang ở giữa, phía trên; đánh từ MỞ ĐẦU đến hết Tài liệu tham khảo và Phụ lục.
- Khổ A4, in một mặt.
- Bảng/hình xoay ngang: đầu bảng là lề trái của trang.

Bỏ qua hoàn toàn: bìa cứng màu xanh chữ nhũ vàng, chữ ký, gấp trang bảng quá rộng.
