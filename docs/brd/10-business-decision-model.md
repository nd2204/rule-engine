# 10. Mô hình quyết định nghiệp vụ

## Decision scope

Business decision là abstraction trung tâm: từ **input context (Facts)**, engine áp dụng bộ **rules** theo **hit policy** để tạo ra **decision result** và **evaluation trace**. Rule là cơ chế; decision là thứ business cần nhận.

## Luồng quyết định

```text
[Caller Service: POS / IoT]
          │
          ▼ (Facts Snapshot)
┌────────────────────────────────────────────────────────┐
│ Business Rule Engine (Pure In-Memory Core in Go)       │
│                                                        │
│  1. Input Schema Validation (Required fields check)    │
│  2. Dynamic Registry Lookup (by decisionId + version)  │
│  3. Rule Evaluation Loop (JSON AST with Safe Nav)      │
│  4. Hit Policy Resolver (FIRST / UNIQUE / PRIORITY /   │
│                          COLLECT)                      │
└────────────────────────────────────────────────────────┘
          │
          ▼
(Decision Result + Trace Summary; full Evaluation Trace on request)
```

## Decision catalogue

| Mã | Quyết định | Input nghiệp vụ (Facts) | Output nghiệp vụ (Payload) | Hit Policy | Pilot Domain |
| --- | --- | --- | --- | --- | --- |
| DEC-POS-01 | Tính toán chiết khấu giỏ hàng (`calculate-pos-discounts`) | `cart`: { items, totalAmount }, `customer`: { tier, loyaltyPoints }, `store`: { branchId } | Danh sách các chiết khấu áp dụng: `[ { code, type, value, reason } ]` | `COLLECT` | Retail ERP / POS |
| DEC-IOT-01 | Xác định lệnh tưới cây thông minh (`determine-irrigation-action`) | `sensor`: { soilMoisture, ambientTemp, airHumidity }, `weather`: { rainForecastProb }, `hardware`: { valveStatus } | Lệnh điều khiển thiết bị: `{ command: "OPEN_VALVE", durationMinutes: 15, mode: "DRIP" }` | `FIRST` | Smart IoT Irrigation |
| DEC-POS-02 | Phân hạng thành viên (`classify-customer-tier`) | `customer`: { spend12Months, orderCount12Months } | Hạng thành viên: `{ tier: "GOLD" }` (MEMBER / SILVER / GOLD / PLATINUM) | `UNIQUE` | Retail ERP / POS |
| DEC-IOT-02 | Xác định mức cảnh báo (`determine-alert-level`) | `sensor`: { ambientTemp, soilMoisture }, `hardware`: { valveStatus, leakDetected } | Mức cảnh báo: `{ level: "CRITICAL", code: "VALVE_LEAK" }` (INFO / WARNING / CRITICAL) | `PRIORITY` | Smart IoT Irrigation |

## Ví dụ end-to-end: Smart IoT Irrigation Decision

### 1. Facts truyền vào (Input):
```json
{
  "sensor": {
    "soilMoisture": 22.5,
    "ambientTemp": 34.0,
    "airHumidity": 45.0
  },
  "weather": {
    "rainForecastProb": 15.0
  },
  "hardware": {
    "valveStatus": "CLOSED"
  }
}
```

### 2. Decision Definition (JSON AST + FIRST Hit Policy):
- **Rule 1 (Mưa sắp tới - Bỏ qua)**: Nếu `weather.rainForecastProb > 70` → Action: `{"command": "SKIP", "reason": "RAIN_EXPECTED"}`
- **Rule 2 (Đất khô hạn khẩn cấp)**: Nếu `sensor.soilMoisture < 25` AND `sensor.ambientTemp >= 32` → Action: `{"command": "OPEN_VALVE", "durationMinutes": 20, "flowRate": "HIGH"}`
- **Rule 3 (Tưới duy trì định kỳ)**: Nếu `sensor.soilMoisture < 40` → Action: `{"command": "OPEN_VALVE", "durationMinutes": 10, "flowRate": "NORMAL"}`

### 3. Kết quả đánh giá (Decision Result):
```json
{
  "decisionId": "determine-irrigation-action",
  "version": 1,
  "status": "SUCCESS",
  "output": {
    "command": "OPEN_VALVE",
    "durationMinutes": 20,
    "flowRate": "HIGH"
  },
  "trace": {
    "evaluatedRulesCount": 2,
    "matchedRuleId": "R02_EMERGENCY_DROUGHT",
    "executionDurationMicroseconds": 124
  }
}
```
