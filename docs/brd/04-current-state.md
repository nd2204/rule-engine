# 4. Trạng thái hiện tại (As-Is)

## Quy trình hiện tại

Business nêu thay đổi chính sách → developer sửa logic trong ứng dụng → kiểm thử → phát hành ứng dụng → theo dõi sau phát hành.

## Cách tạo và thay đổi business rule hiện tại

Rule thường là câu lệnh điều kiện trong code. Các ứng dụng và domain có thể dùng cách triển khai khác nhau, không có điểm quản trị chung.

## Điểm đau và hạn chế

- Không thể thay đổi policy độc lập với mã nguồn ứng dụng.
- Khó so sánh, kiểm thử và khôi phục chính sách cũ.
- Không có trace thống nhất trả lời “vì sao có decision này?”.
