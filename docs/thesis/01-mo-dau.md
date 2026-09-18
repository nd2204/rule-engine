# MỞ ĐẦU

## 1. Lý do chọn đề tài

Trong quá trình phát triển các hệ thống phần mềm, logic nghiệp vụ (business logic) thường xuyên thay đổi theo yêu cầu của doanh nghiệp. Các luật nghiệp vụ (business rule) như điều kiện xét duyệt, chính sách giảm giá, cách tính phí, phân loại khách hàng hay quy trình xử lý có thể được điều chỉnh nhiều lần trong suốt vòng đời của một hệ thống.

Trong các hệ thống truyền thống, những luật này thường được cài đặt trực tiếp trong mã nguồn. Khi nghiệp vụ thay đổi, lập trình viên phải sửa mã, kiểm thử và triển khai lại ứng dụng. Cách tiếp cận này tạo ra sự phụ thuộc chặt chẽ giữa logic nghiệp vụ và mã nguồn ứng dụng, làm tăng chi phí bảo trì và khiến hệ thống khó thích ứng với những thay đổi nghiệp vụ thường xuyên. Bên cạnh đó, khi một quyết định nghiệp vụ bị khiếu nại hoặc gây sự cố, việc tái hiện chính xác lý do hệ thống đã đưa ra quyết định đó cũng trở nên khó khăn, vì logic nằm rải rác trong mã của từng ứng dụng.

Từ vấn đề trên, đề tài xây dựng một Business Rule Engine (BRE) được lựa chọn với mục tiêu nghiên cứu và xây dựng một hệ thống cho phép đưa logic nghiệp vụ ra khỏi mã nguồn ứng dụng và biểu diễn chúng dưới dạng các luật có thể cấu hình. Qua đó, việc thay đổi một chính sách nghiệp vụ được thực hiện bằng cách thay đổi luật thay vì sửa đổi trực tiếp mã nguồn.

Bên cạnh khả năng cấu hình luật, đề tài quan tâm đến việc quản lý vòng đời của luật: kiểm thử và mô phỏng trước khi áp dụng, quản lý phiên bản, quay lui khi có lỗi và giải trình quá trình thực thi. Đây là những yếu tố cần thiết để một rule engine có thể được sử dụng một cách an toàn và có kiểm soát trong thực tế.

## 2. Mục đích nghiên cứu

Mục đích của đề tài là xây dựng một BRE độc lập với lĩnh vực nghiệp vụ, trong đó mỗi quyết định nghiệp vụ được mô hình hoá thành một quyết định gồm tập luật, lược đồ dữ liệu đầu vào và *hit policy* (chiến lược tổng hợp kết quả khi nhiều luật cùng khớp). Ứng dụng gọi gửi các dữ kiện cần thiết, hệ thống đánh giá tập luật hoàn toàn trong bộ nhớ và trả về kết quả quyết định kèm vết đánh giá giải thích vì sao kết quả đó được đưa ra.

Sản phẩm hướng tới hai nhóm người dùng có vai trò ngang nhau:

- **Người soạn luật**: người sở hữu chính sách nghiệp vụ, cần soạn luật dưới dạng bảng quyết định, kiểm tra tác động của thay đổi bằng mô phỏng và ca kiểm thử, phát hành phiên bản mới hoặc *rollback* (quay lui phiên bản) khi cần mà không phải chờ một đợt phát hành phần mềm.
- **Người tích hợp**: người kết nối ứng dụng gọi với hệ thống, cần một giao diện gọi đơn giản, kết quả xác định và ổn định, có thể chỉ định chính xác phiên bản quyết định được dùng.

Để đạt mục đích trên, đề tài đặt ra các mục tiêu cụ thể:

- Biểu diễn luật một cách an toàn, không thực thi mã tuỳ ý, hỗ trợ đủ bốn hit policy: FIRST, UNIQUE, PRIORITY và COLLECT.
- Quản lý vòng đời quyết định gồm bản nháp, mô phỏng, phát hành và rollback, trong đó một phiên bản chỉ được phát hành khi đã có ca kiểm thử và tất cả đều đạt.
- Nạp phiên bản mới trong lúc hệ thống đang phục vụ mà không làm gián đoạn các yêu cầu đánh giá đang chạy.
- Đảm bảo mọi kết quả quyết định đều giải trình và tái hiện được.

## 3. Đối tượng và phạm vi nghiên cứu

**Đối tượng nghiên cứu** của đề tài gồm:

- Mô hình Business Rule Engine và cách tách logic nghiệp vụ khỏi mã nguồn ứng dụng.
- Bảng quyết định và các hit policy dùng để tổng hợp kết quả khi nhiều luật cùng khớp.
- Phương pháp biểu diễn điều kiện an toàn bằng cây cú pháp trừu tượng.
- Vòng đời phiên bản của quyết định: bản nháp, mô phỏng, phát hành và rollback.

**Phạm vi nghiên cứu** giới hạn ở giai đoạn thứ nhất của sản phẩm, gồm:

- Lõi BRE đánh giá quyết định hoàn toàn trong bộ nhớ, không thực hiện truy vấn cơ sở dữ liệu hay gọi mạng trong quá trình đánh giá.
- Lớp quản trị vòng đời quyết định, lưu trữ bản nháp, ca kiểm thử và các phiên bản đã phát hành.
- Giao diện tích hợp gồm giao diện lập trình ứng dụng qua HTTP cho ứng dụng gọi và công cụ dòng lệnh cho người soạn luật.
- Kiểm chứng trên hai lĩnh vực có đặc điểm khác nhau: chiết khấu giỏ hàng trong bán lẻ và điều khiển tưới tiêu dựa trên dữ liệu cảm biến, với bốn quyết định phủ đủ bốn hit policy.

Các nội dung **không thuộc phạm vi** đề tài: giao diện web soạn luật trực quan, suy diễn nhiều bước theo thuật toán Rete, xác thực và phân quyền người dùng, lưu nhật ký các lần đánh giá phía hệ thống, chế độ nhúng lõi trực tiếp vào ứng dụng gọi và các phép tính số học phức tạp bên trong điều kiện.

## 4. Ý nghĩa khoa học và thực tiễn

**Ý nghĩa khoa học.** Đề tài hệ thống hoá các khái niệm cốt lõi của bài toán quản lý quyết định nghiệp vụ, gồm dữ kiện, luật, quyết định, hit policy và vết đánh giá, đối chiếu chúng với chuẩn Decision Model and Notation (DMN) và lý giải các lựa chọn khác với chuẩn. Đề tài cũng đề xuất một kiến trúc tách lõi đánh giá thuần, không có thao tác vào ra, khỏi lớp quản trị vòng đời, qua đó cho thấy có thể đồng thời đạt được tính xác định của kết quả, khả năng nạp phiên bản mới khi đang vận hành và khả năng tái hiện mọi quyết định.

**Ý nghĩa thực tiễn.** Hệ thống cho phép người soạn luật thay đổi một chính sách nghiệp vụ thông qua quy trình bản nháp, mô phỏng và phát hành, thay cho quy trình sửa mã, xây dựng và triển khai lại ứng dụng. Mỗi thay đổi đều được kiểm tra bằng ca kiểm thử trước khi có hiệu lực và có thể quay lui ngay khi phát hiện sai sót. Vết đánh giá đi kèm mỗi kết quả giúp người vận hành giải trình được lý do của từng quyết định khi có khiếu nại hoặc sự cố. Do lõi không phụ thuộc lĩnh vực, cùng một hệ thống có thể phục vụ nhiều loại quyết định khác nhau, từ chính sách khuyến mãi trong bán lẻ đến điều khiển thiết bị trong nông nghiệp thông minh.
