# 7. Stakeholder

| Nhóm Stakeholder | Vai trò trong hệ thống | Trách nhiệm chính | Mối quan tâm cốt lõi |
| --- | --- | --- | --- |
| **Rule Author** | Người sở hữu chính sách | Soạn thảo logic nghiệp vụ, ngưỡng chiết khấu, điều kiện tưới | Dễ hiểu, mô hình hoá dạng bảng (Decision Table), kiểm soát phiên bản |
| **Integrator** | Người tích hợp hệ thống | Tích hợp BRE vào POS service và IoT backend, chuẩn bị Facts snapshot | Hiệu năng cao (Go runtime), API gọn gàng, typing an toàn, deterministic |
| **System Administrator / DevOps** | Người vận hành hạ tầng | Giám sát độ trễ, tài nguyên RAM/CPU, quản lý hot-reload | Ổn định, không rò rỉ bộ nhớ, khởi động nhanh, zero-downtime config reload |
