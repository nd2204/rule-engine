# CHƯƠNG 1. TỔNG QUAN

Chương này phân tích vấn đề nhúng cứng luật nghiệp vụ vào mã nguồn và các nguyên tắc của cách tiếp cận dựa trên luật nghiệp vụ. Từ đó, chương rút ra năm tiêu chí để đánh giá các giải pháp hiện có. Ba giải pháp tiêu biểu là Drools, Camunda DMN và GoRules Zen được phân tích và so sánh theo các tiêu chí này. Phần cuối chương chỉ ra những vấn đề còn tồn tại và vấn đề mà đồ án tập trung giải quyết.

## 1.1. Luật nghiệp vụ trong phần mềm và vấn đề nhúng cứng vào mã nguồn

Trong các hệ thống phần mềm nghiệp vụ, luật thường được cài đặt dưới dạng các câu lệnh điều kiện nằm trực tiếp trong mã nguồn ứng dụng. Trong bối cảnh nghiệp vụ mà đồ án hướng tới, gồm chính sách chiết khấu trong bán lẻ và điều khiển thiết bị tưới tiêu, quy trình thay đổi một chính sách diễn ra theo chuỗi: bộ phận nghiệp vụ đề xuất thay đổi, lập trình viên sửa logic trong ứng dụng, kiểm thử, phát hành phiên bản ứng dụng mới rồi theo dõi sau phát hành. Mỗi ứng dụng, mỗi lĩnh vực lại có cách cài đặt luật riêng và không có một điểm quản trị chung.

Cách làm này dẫn tới ba hạn chế. Thứ nhất, chính sách không thể thay đổi độc lập với mã nguồn, nên thời gian đưa một thay đổi vào vận hành bị ràng buộc vào chu kỳ phát hành phần mềm. Thứ hai, vì luật nằm rải rác trong mã, việc so sánh hai phiên bản chính sách, kiểm thử riêng phần luật hay khôi phục một chính sách cũ đều khó thực hiện. Thứ ba, hệ thống không có một vết thống nhất để trả lời câu hỏi "vì sao quyết định này được đưa ra?", nên khi có khiếu nại hoặc sự cố, người vận hành phải đọc lại mã để suy ra lý do.

Những hạn chế trên đã được nhận diện từ lâu trong cách tiếp cận dựa trên luật nghiệp vụ (business rules approach). Bản Tuyên ngôn về luật nghiệp vụ (Business Rules Manifesto) của Business Rules Group cho rằng luật không phải là quy trình hay thủ tục và không nên bị chứa trong quy trình hay thủ tục [4]. Về chiến lược cài đặt, tuyên ngôn khẳng định: "*Executing rules directly — for example in a rules engine — is a better implementation strategy than transcribing the rules into some procedural form.*" [4]. Cùng văn bản này đặt ra yêu cầu về khả năng giải trình: "*A business rule system must always be able to explain the reasoning by which it arrives at conclusions or takes action.*" [4]. Ngoài ra, tuyên ngôn yêu cầu người làm nghiệp vụ phải có công cụ để soạn, kiểm định và quản lý luật [4]. Ba nguyên tắc này, gồm tách luật khỏi mã thủ tục, giải trình được kết quả và có công cụ kiểm định luật, là cơ sở để đồ án xác định các yêu cầu cho hệ thống.

Ở cấp độ chuẩn hoá, Object Management Group ban hành chuẩn Decision Model and Notation (DMN) với mục tiêu cung cấp một ký pháp chung mà cả người phân tích nghiệp vụ, lập trình viên tự động hoá quyết định lẫn người quản lý quyết định đều hiểu được [5]. DMN được mô tả như một cầu nối chuẩn hoá giữa thiết kế quyết định nghiệp vụ và cài đặt quyết định [5]. Bảng quyết định và các hit policy trong DMN là nền tảng khái niệm mà đồ án sử dụng và sẽ được trình bày chi tiết ở Chương 2.

Tuy vậy, rule engine không phải lúc nào cũng là lời giải tốt. Martin Fowler chỉ ra rằng cơ chế suy diễn nối tiếp giữa các luật (chaining) tuy cho phép biểu diễn hành vi phức tạp nhưng: "*can easily end up being very hard to reason about and debug.*" [6]. Ông cũng hoài nghi lời hứa rằng người làm nghiệp vụ có thể tự viết luật mà không cần lập trình viên, đồng thời nhấn mạnh rằng hành vi ngầm định của luật khiến kiểm thử càng trở nên quan trọng [6]. Từ đó, Fowler gợi ý một hướng tiếp cận hẹp hơn, trong đó nhóm phát triển xây dựng một rule engine giới hạn, chỉ được thiết kế để hoạt động trong một phạm vi xác định [6]. Nhận định này cho thấy giá trị của một rule engine không nằm ở sức mạnh suy diễn, mà ở việc luật có dễ hiểu, dễ kiểm thử và dễ giải trình hay không.

Từ các phân tích trên, đồ án sử dụng năm tiêu chí để đánh giá các giải pháp hiện có:

- **Mô hình thực thi**: luật được đánh giá như thế nào, có suy diễn nối tiếp hay chỉ đánh giá một lượt.
- **Biểu diễn luật**: luật được soạn ở định dạng nào và có cho phép thực thi mã tuỳ ý hay không.
- **Quản lý phiên bản và vòng đời**: cách một thay đổi đi từ bản soạn thảo đến khi có hiệu lực, và cách quay lui khi có sai sót.
- **Khả năng giải trình**: hệ thống cung cấp thông tin gì để trả lời vì sao một quyết định được đưa ra.
- **Khả năng nhúng và giấy phép**: nền tảng chạy, cách tích hợp vào ứng dụng và điều kiện sử dụng.

## 1.2. Các giải pháp hiện có

Ba giải pháp được chọn để phân tích, mỗi giải pháp đại diện cho một hướng tiếp cận khác nhau. Drools là hệ thống luật nghiệp vụ kinh điển trên nền Java, dựa trên họ thuật toán Rete. Camunda DMN là một hiện thực tiêu biểu của chuẩn DMN, gắn với nền tảng tự động hoá quy trình. GoRules Zen là engine thế hệ mới, biểu diễn quyết định dưới dạng JSON và có thư viện cho ngôn ngữ Go, là ngôn ngữ mà đồ án sử dụng. Mỗi giải pháp được phân tích theo năm tiêu chí đã nêu ở mục 1.1.

### 1.2.1. Drools

Drools là dự án mã nguồn mở thuộc Apache KIE; tài liệu được khảo sát là Drools User Guide phiên bản 10.2.0.

**Mô hình thực thi.** Drools đánh giá luật bằng thuật toán Phreak, được phát triển từ thuật toán Rete và biến thể hướng đối tượng ReteOO của các phiên bản trước [7]. Trong khi Rete đánh giá luật ngay khi dữ liệu thay đổi và hướng dữ liệu, Phreak trì hoãn việc đánh giá và hướng mục tiêu [7]. Dữ kiện được chèn vào bộ nhớ làm việc (working memory), được so khớp với các luật trong bộ nhớ luật, và các luật thoả điều kiện được xếp vào một hàng đợi (agenda) để thực thi [7]. Ngoài chế độ suy diễn thông thường, Drools có chế độ tuần tự (sequential mode), trong đó các luật được đánh giá một lần theo thứ tự trong agenda mà không xét lại khi bộ nhớ làm việc thay đổi [7].

**Biểu diễn luật.** Drools hỗ trợ ba dạng biểu diễn chính. Dạng thứ nhất là ngôn ngữ Drools Rule Language (DRL), viết trong các tệp văn bản `.drl` [8]. Dạng thứ hai là bảng quyết định dạng bảng tính XLS hoặc XLSX, trong đó mỗi dòng là một luật và mỗi cột là một điều kiện, một hành động hoặc một thuộc tính của luật; các bảng này được biên dịch sang DRL [8]. Dạng thứ ba là mô hình DMN: engine DMN của Drools hỗ trợ DMN 1.1 đến 1.4 ở mức tuân thủ 3, với biểu thức viết bằng ngôn ngữ Friendly Enough Expression Language (FEEL) [9]. Theo tài liệu, bảng quyết định DMN trong Drools hỗ trợ các hit policy Unique, Any, Priority, First và Collect [9].

**Quản lý phiên bản và vòng đời.** Một dự án Drools đồng thời là một dự án Maven, được đóng gói thành KJAR và định danh duy nhất bằng bộ ba groupId, artifactId và version [10]. Thành phần KieScanner theo dõi kho Maven; khi phát hiện phiên bản mới của dự án, nó tự động tải về và biên dịch tăng dần dự án mới [10]. Tuy nhiên, KieScanner chỉ nhận thay đổi khi dự án dùng phiên bản SNAPSHOT, khoảng phiên bản hoặc các giá trị LATEST, RELEASE [10]. Như vậy, vòng đời của luật trong Drools gắn với vòng đời đóng gói và phát hành của Maven. Tài liệu lõi không mô tả các bước bản nháp, mô phỏng hay phê duyệt trước khi phát hành.

**Khả năng giải trình.** Drools không trả về vết đánh giá kèm kết quả. Thay vào đó, ứng dụng có thể đăng ký các bộ lắng nghe sự kiện (event listener) như `AgendaEventListener` hoặc `RuleRuntimeEventListener`; engine gọi các bộ lắng nghe này mỗi khi có hoạt động, giúp tách việc ghi nhật ký và kiểm toán khỏi phần lõi của ứng dụng [7]. Tài liệu cũng lưu ý rằng các lời gọi này chặn luồng thực thi của engine, nên có thể ảnh hưởng tới hiệu năng [7]. Với mô hình DMN, ứng dụng có thể đăng ký bộ lắng nghe để nhận các sự kiện trong quá trình đánh giá [9].

**Khả năng nhúng và giấy phép.** Drools là thư viện Java, yêu cầu JDK 17 trở lên, và có thể dùng như một thư viện nhúng hoặc qua nền tảng Kogito cho môi trường cloud-native [11]. Mã nguồn được phát hành theo giấy phép Apache-2.0 [12].

Tóm lại, Drools là một engine suy diễn mạnh với nhiều dạng biểu diễn luật. Đổi lại, việc giải trình phụ thuộc vào mã do ứng dụng tự viết, vòng đời luật gắn với quy trình đóng gói Maven, và engine chỉ chạy trên nền Java Virtual Machine (JVM).

### 1.2.2. Camunda DMN

Camunda cung cấp engine DMN qua hai thế hệ sản phẩm. Bản cộng đồng của Camunda 7 đã kết thúc vòng đời và kho mã nguồn đã được lưu trữ, chỉ bản thương mại còn nhận bản vá bảo trì và bảo mật [13]. Engine DMN của Camunda 7 là một thư viện Java đánh giá bảng quyết định theo chuẩn DMN 1.3 và có thể nhúng vào ứng dụng [14]. Vì Camunda 7 bản cộng đồng không còn được phát triển, phần phân tích dưới đây tập trung vào Camunda 8, tài liệu phiên bản 8.9.

**Mô hình thực thi.** Camunda 8 đánh giá quyết định bằng engine dmn-scala, engine này dùng FEEL-Scala để đánh giá biểu thức FEEL [15]. Khác với Drools, Camunda không suy diễn nối tiếp giữa các luật mà đánh giá trực tiếp bảng quyết định hoặc biểu thức của từng quyết định.

**Biểu diễn luật.** Quyết định được biểu diễn bằng tệp XML theo chuẩn DMN, với biểu thức FEEL. Công cụ Modeler của Camunda 8 hỗ trợ mô hình DMN 1.3, gồm bảng quyết định, biểu thức, dữ liệu đầu vào, nguồn tri thức và mô hình tri thức nghiệp vụ [16]. Camunda hỗ trợ năm hit policy: Unique, Any, First, Rule order và Collect, trong đó Collect có thể kèm phép gộp SUM, MIN, MAX hoặc COUNT; nếu không khai báo, hit policy mặc định là Unique [17]. Danh sách này không có Priority và Output order.

**Quản lý phiên bản và vòng đời.** Mỗi lần triển khai, quyết định nhận một số phiên bản mới do nền tảng cấp. Khi một quy trình gọi quyết định, thuộc tính `bindingType` cho biết phiên bản nào được dùng: `latest` là phiên bản được triển khai gần nhất tại thời điểm gọi, `deployment` là phiên bản được triển khai cùng quy trình, còn `versionTag` là phiên bản gần nhất mang nhãn phiên bản chỉ định [18]. Tài liệu hướng dẫn của Camunda cảnh báo rằng dùng `latest` có thể gây hành vi không mong muốn nếu phiên bản mới được triển khai mà không đảm bảo tương thích ngược [19]. Vì `latest` luôn là bản triển khai mới nhất, muốn quay lại chính sách cũ thì phải triển khai lại hoặc ghim phiên bản bằng nhãn. Đây là nhận định của tác giả, vì tài liệu không mô tả một thao tác quay lui riêng.

**Khả năng giải trình.** Camunda lưu lịch sử của từng lần đánh giá quyết định. Qua giao diện lập trình, có thể truy vấn các đầu vào đã được đánh giá và các luật đã khớp của mỗi lần đánh giá [20]. Lịch sử này do nền tảng ghi lại và lưu trữ, không phải dữ liệu đi kèm kết quả trả về cho ứng dụng gọi.

**Khả năng nhúng và giấy phép.** Camunda 8 được thiết kế như một nền tảng dịch vụ. Các thành phần chính Zeebe, Operate và Tasklist được phát hành theo Camunda License 1.0, chỉ một số phần dùng giấy phép Apache-2.0 [21]. Riêng dmn-scala là thư viện Scala độc lập, chạy trên JVM và có thể nhúng vào ứng dụng [15].

Tóm lại, Camunda bám sát chuẩn DMN và có lịch sử đánh giá đầy đủ. Tuy nhiên, việc quản lý phiên bản và giải trình gắn chặt với nền tảng Camunda 8, vốn không phải mã nguồn mở hoàn toàn, còn phần engine nhúng được thì chỉ chạy trên JVM.

### 1.2.3. GoRules Zen

GoRules Zen (ZEN Engine) là rule engine mã nguồn mở có lõi viết bằng Rust, có thư viện gốc cho Node.js, Python, Go, Java, Kotlin, .NET cùng các gói cho iOS và Android, phát hành theo giấy phép MIT [22]. Tài liệu được khảo sát ứng với phiên bản 2.1.2.

**Mô hình thực thi.** Zen biểu diễn mỗi quyết định thành một đồ thị có hướng. Dữ liệu đi vào từ nút đầu vào, được các nút xử lý lần lượt, kết quả được chuyển xuống các nút phía sau, và nếu một nút có nhiều đầu vào thì dữ liệu từ các nguồn được gộp lại [23]. Từ phiên bản 2.0, quyết định được phân tích và biên dịch một lần khi nạp, các lần đánh giá sau dùng lại bản đã biên dịch [22].

**Biểu diễn luật.** Đồ thị quyết định được lưu ở định dạng JSON Decision Model (JDM), một cấu trúc JavaScript Object Notation (JSON) gồm danh sách nút và cạnh, có thể quản lý phiên bản bằng Git cùng mã nguồn [24]. Nút bảng quyết định có hai hit policy là First (mặc định) và Collect, ngoài ra có thể thu thập riêng từng cột trên mọi dòng khớp [25]. Bên cạnh các nút khai báo, Zen có nút hàm (function node) cho phép chạy logic JavaScript tuỳ biến [23]. Điều đó có nghĩa là một quyết định có thể chứa mã thực thi tuỳ ý.

**Quản lý phiên bản và vòng đời.** Engine mã nguồn mở không quản lý phiên bản. Việc nạp nội dung JSON từ tệp, cơ sở dữ liệu hay dịch vụ do ứng dụng tự đảm nhiệm [22]. Vòng đời đầy đủ thuộc về nền tảng thương mại GoRules BRMS. Trên nền tảng đó, một bản phát hành là ảnh chụp bất biến của một nhánh tại một thời điểm, bản nháp là bản phát hành chưa có số phiên bản, và việc quay lui được thực hiện bằng cách triển khai lại một bản phát hành cũ [26].

**Khả năng giải trình.** Khi đánh giá, ứng dụng có thể bật tuỳ chọn `trace` để nhận đầu vào, đầu ra và thời gian xử lý của từng nút trong đồ thị [27]. Vết này được ghi theo đơn vị nút của đồ thị.

**Khả năng nhúng và giấy phép.** Thư viện cho Go (zen-go) gọi lõi Rust qua cgo và liên kết với thư viện gốc dựng sẵn cho một số hệ điều hành và kiến trúc; thư viện chưa hỗ trợ môi trường linux-musl [28]. Do đó, một ứng dụng Go nhúng Zen phụ thuộc vào cgo và thư viện gốc của nền tảng.

Tóm lại, Zen nhẹ, nhanh và dùng định dạng JSON thuận tiện cho quản lý phiên bản. Tuy nhiên, nút hàm cho phép chạy JavaScript tuỳ biến, vòng đời phiên bản nằm ngoài engine mã nguồn mở, và thư viện cho Go không phải mã Go thuần.

## 1.3. Đánh giá, so sánh các giải pháp

Kết quả phân tích ba giải pháp theo năm tiêu chí ở mục 1.1 được tổng hợp trong Bảng 1.1.

**Bảng 1.1.** So sánh các giải pháp hiện có

| Tiêu chí | Drools 10.2 | Camunda 8.9 | GoRules Zen 2.1 |
|----------|-------------|-------------|-----------------|
| Mô hình thực thi | Phreak (phát triển từ Rete), có chế độ tuần tự | Đánh giá trực tiếp bảng quyết định DMN | Duyệt đồ thị quyết định có hướng |
| Biểu diễn luật | DRL, bảng tính XLS/XLSX, DMN 1.1–1.4 + FEEL | DMN 1.3 (XML) + FEEL | JDM (JSON); nút hàm chạy JavaScript |
| Hit policy | Unique, Any, Priority, First, Collect | Unique, Any, First, Rule order, Collect | First, Collect |
| Phiên bản và vòng đời | Đóng gói KJAR theo Maven; KieScanner nạp phiên bản mới | Phiên bản tăng theo mỗi lần triển khai; `latest` là bản mới nhất; nhãn phiên bản | Engine không quản lý; vòng đời thuộc nền tảng thương mại |
| Giải trình | Bộ lắng nghe sự kiện do ứng dụng tự đăng ký | Lịch sử đánh giá do nền tảng lưu | Tuỳ chọn `trace` theo từng nút |
| Nền tảng nhúng | Thư viện Java (JDK 17+) | Nền tảng dịch vụ; dmn-scala nhúng được trên JVM | Lõi Rust; thư viện Go qua cgo |
| Giấy phép | Apache-2.0 | Camunda License 1.0 (thành phần chính) | MIT (engine); nền tảng thương mại |

Nguồn: Tác giả tổng hợp từ [7]–[12], [15]–[28]

Như được nêu trong Bảng 1.1, ba giải pháp có chung một điểm: đều hỗ trợ bảng quyết định và tách luật khỏi mã nguồn ứng dụng. Khác biệt lớn nhất nằm ở hai tiêu chí quản lý vòng đời và giải trình. Ở Drools, cả hai được giao cho ứng dụng hoặc cho hệ sinh thái Maven. Ở Camunda và GoRules, cả hai gắn với một nền tảng bao quanh engine; nền tảng của Camunda 8 không phải mã nguồn mở hoàn toàn, còn nền tảng của GoRules là sản phẩm thương mại. Về mô hình thực thi, chỉ Drools dùng cơ chế suy diễn nối tiếp, trong khi Camunda và Zen đánh giá quyết định theo cấu trúc bảng hoặc đồ thị đã khai báo. Về nền tảng, hai giải pháp chạy trên JVM, còn giải pháp có thư viện Go thì cần cgo và thư viện gốc.

## 1.4. Vấn đề còn tồn tại và hướng giải quyết của đồ án

Đối chiếu ba giải pháp với các nguyên tắc ở mục 1.1, tác giả nhận thấy ba vấn đề còn tồn tại.

**Thứ nhất, vòng đời của luật chưa gắn với kiểm thử bắt buộc ngay trong engine mã nguồn mở.** Nguyên tắc yêu cầu công cụ để kiểm định luật trước khi áp dụng [4], và hành vi ngầm định của luật đòi hỏi kiểm thử kỹ hơn [6]. Tuy vậy, trong các giải pháp được khảo sát, quy trình bản nháp, kiểm thử trước phát hành và quay lui chỉ có trên nền tảng thương mại của GoRules [26]. Drools dựa vào vòng đời đóng gói Maven [10]. Camunda định nghĩa `latest` là bản được triển khai gần nhất, nên quay lui đồng nghĩa với triển khai lại [18].

**Thứ hai, khả năng giải trình chưa phải là đầu ra mặc định của mỗi lần đánh giá.** Trong ba giải pháp, thông tin giải trình hoặc phải do ứng dụng tự thu thập qua bộ lắng nghe [7], hoặc được nền tảng lưu thành lịch sử tách khỏi kết quả trả về [20], hoặc được ghi ở mức nút của đồ thị [27]. Chưa giải pháp nào trả kèm mỗi kết quả quyết định một vết cho biết điều kiện nào đúng, luật nào khớp và vì sao luật đó được chọn theo hit policy.

**Thứ ba, chưa có lựa chọn gọn nhẹ, an toàn, chạy thuần trong hệ sinh thái Go.** Hai giải pháp chạy trên JVM. Giải pháp có thư viện Go thì phụ thuộc cgo [28] và cho phép chạy mã JavaScript tuỳ biến trong quyết định [23], trái với yêu cầu biểu diễn luật an toàn.

Từ ba vấn đề trên, đồ án tập trung giải quyết bài toán xây dựng một BRE theo hướng hẹp mà Fowler gợi ý [6]. Engine chỉ đánh giá một lượt, không suy diễn nối tiếp, và được viết hoàn toàn bằng Go. Cụ thể, đồ án:

- Biểu diễn luật bằng bảng quyết định được chuyển thành cây cú pháp trừu tượng (Abstract Syntax Tree – AST), không thực thi mã tuỳ ý, và hỗ trợ bốn hit policy FIRST, UNIQUE, PRIORITY và COLLECT.
- Đưa vòng đời bản nháp, mô phỏng, phát hành và rollback vào chính hệ thống. Một phiên bản chỉ được phát hành khi có ca kiểm thử và tất cả đều đạt. Con trỏ *latest* được quản lý tường minh, nên rollback chỉ là di chuyển con trỏ về một phiên bản đã phát hành trước đó.
- Trả kèm mỗi kết quả quyết định một bản tóm tắt vết, và cung cấp vết đánh giá đầy đủ đến từng điều kiện khi được yêu cầu.
- Phát hành mã nguồn theo giấy phép Apache-2.0.

Các khái niệm và cơ sở lý thuyết cho những lựa chọn trên, gồm chuẩn DMN, các mô hình thực thi luật, biểu diễn điều kiện bằng AST và quản lý phiên bản, được trình bày ở Chương 2.
