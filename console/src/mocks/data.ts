// Illustrative sample data for the four pilot Decisions named in the spec.
// Rules, thresholds, dates and Test Cases are synthetic, written for the
// console demo only; replace them with the real pilot artifacts when they exist.

import type { Cell, DecisionVersion, Draft, InputField, OutputField, Rule, RuleSet, TestCase } from '../domain/types';

export interface DecisionRecord {
  id: string;
  title: string;
  domain: string;
  latest: number;
  versions: DecisionVersion[];
  drafts: Draft[];
  testCases: TestCase[];
}

const x = (text: string): Cell => ({ kind: 'expr', text });

function rule(id: string, description: string, when: Record<string, string | Cell>, then: Rule['then'], weight?: number): Rule {
  const cells: Record<string, Cell> = {};
  for (const [k, v] of Object.entries(when)) cells[k] = typeof v === 'string' ? x(v) : v;
  return { id, description, when: cells, then, ...(weight === undefined ? {} : { weight }) };
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

function versions(
  decisionId: string,
  history: { note: string; publishedAt: string; ruleSet?: RuleSet }[],
): DecisionVersion[] {
  // Versions without their own Rule Set reuse the next explicit one.
  const out: DecisionVersion[] = [];
  let carry: RuleSet | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    carry = history[i].ruleSet ?? carry;
    out.unshift({ decisionId, version: i + 1, ruleSet: clone(carry!), publishedAt: history[i].publishedAt, note: history[i].note });
  }
  return out;
}

// ---------------- calculate-pos-discounts (COLLECT) ----------------

const cartItemFields: InputField[] = [
  { name: 'sku', type: 'string', required: true, label: 'Mã hàng' },
  { name: 'category', type: 'string', required: true, label: 'Nhóm hàng' },
  { name: 'qty', type: 'number', required: true, label: 'Số lượng' },
  { name: 'price', type: 'number', required: true, label: 'Đơn giá', unit: '₫' },
];

const posInputs: InputField[] = [
  { name: 'customerTier', type: 'string', required: true, label: 'Hạng khách' },
  { name: 'cartTotal', type: 'number', required: true, label: 'Tổng giỏ', unit: '₫' },
  { name: 'items', type: 'list', required: true, label: 'Mặt hàng', itemFields: cartItemFields },
  { name: 'weekday', type: 'string', required: true, label: 'Thứ' },
];

const posOutputs: OutputField[] = [
  { name: 'discountCode', type: 'string', label: 'Mã ưu đãi' },
  { name: 'percent', type: 'number', label: 'Giảm', unit: '%' },
  { name: 'amount', type: 'number', label: 'Giảm', unit: '₫' },
];

const beverageBundle: Cell = {
  kind: 'ast',
  ast: {
    op: 'some',
    path: 'items',
    where: {
      op: 'and',
      args: [
        { op: '==', path: 'category', value: 'BEVERAGE' },
        { op: '>=', path: 'qty', value: 2 },
      ],
    },
  },
};

const posV6: RuleSet = {
  hitPolicy: 'COLLECT',
  inputs: posInputs,
  outputs: posOutputs,
  rules: [
    rule('GOLD5', 'Khách hạng GOLD giảm 5% toàn giỏ', { customerTier: 'GOLD' }, { discountCode: 'GOLD5', percent: 5, amount: null }),
    rule('BIGCART', 'Giỏ lớn được trừ thẳng 50.000 ₫', { cartTotal: '>= 1200000' }, { discountCode: 'BIGCART', percent: null, amount: 50000 }),
    rule('BEV2', 'Mua từ 2 đồ uống cùng loại giảm 10%', { items: beverageBundle }, { discountCode: 'BEV2', percent: 10, amount: null }),
  ],
};

const posV7: RuleSet = {
  ...clone(posV6),
  rules: [
    ...clone(posV6.rules),
    rule('WKND', 'Cuối tuần giảm thêm 2%', { weekday: 'in [SAT, SUN]' }, { discountCode: 'WKND', percent: 2, amount: null }),
  ],
};

const posDraft: RuleSet = {
  hitPolicy: 'COLLECT',
  inputs: [...posInputs, { name: 'channel', type: 'string', required: true, label: 'Kênh bán' }],
  outputs: posOutputs,
  rules: [
    clone(posV6.rules[0]),
    rule('BIGCART', 'Giỏ lớn được trừ thẳng 50.000 ₫', { cartTotal: '>= 1000000' }, { discountCode: 'BIGCART', percent: null, amount: 50000 }),
    clone(posV6.rules[2]),
    rule('ONL30', 'Đơn online từ 300.000 ₫ trừ 30.000 ₫', { channel: 'ONLINE', cartTotal: '>= 300000' }, { discountCode: 'ONL30', percent: null, amount: 30000 }),
  ],
};

const cola = (qty: number) => ({ sku: 'NUOC-COLA-330', category: 'BEVERAGE', qty, price: 12000 });
const snack = { sku: 'BANH-QUY-200', category: 'SNACK', qty: 1, price: 45000 };

const posTests: TestCase[] = [
  {
    id: 'TC-01',
    name: 'Khách GOLD, giỏ lớn cuối tuần',
    facts: { customerTier: 'GOLD', cartTotal: 1500000, items: [cola(2), snack], weekday: 'SAT', channel: 'POS' },
    expected: {
      outputs: [
        { discountCode: 'GOLD5', percent: 5, amount: null },
        { discountCode: 'BIGCART', percent: null, amount: 50000 },
        { discountCode: 'BEV2', percent: 10, amount: null },
        { discountCode: 'WKND', percent: 2, amount: null },
      ],
    },
  },
  {
    id: 'TC-02',
    name: 'Giỏ nhỏ ngày thường',
    facts: { customerTier: 'STANDARD', cartTotal: 250000, items: [snack], weekday: 'TUE', channel: 'POS' },
    expected: { outputs: [] },
  },
  {
    id: 'TC-03',
    name: 'Giỏ 1.050.000 ₫ thứ Tư',
    facts: { customerTier: 'SILVER', cartTotal: 1050000, items: [snack], weekday: 'WED', channel: 'POS' },
    expected: { outputs: [{ discountCode: 'BIGCART', percent: null, amount: 50000 }] },
  },
  {
    id: 'TC-04',
    name: 'Đơn online 350.000 ₫',
    facts: { customerTier: 'STANDARD', cartTotal: 350000, items: [snack], weekday: 'MON', channel: 'ONLINE' },
    expected: { outputs: [{ discountCode: 'ONL30', percent: null, amount: 30000 }] },
  },
  {
    id: 'TC-05',
    name: 'Chỉ một lon nước ngọt',
    facts: { customerTier: 'STANDARD', cartTotal: 400000, items: [cola(1), snack], weekday: 'FRI', channel: 'POS' },
    expected: { outputs: [] },
  },
  {
    id: 'TC-06',
    name: 'Giỏ 1.100.000 ₫ thứ Năm',
    facts: { customerTier: 'SILVER', cartTotal: 1100000, items: [snack], weekday: 'THU', channel: 'POS' },
    expected: { outputs: [] },
  },
];

// ---------------- determine-irrigation-action (FIRST) ----------------

const irrigationInputs: InputField[] = [
  { name: 'tankLevel', type: 'number', required: true, label: 'Mực bồn', unit: '%' },
  { name: 'rainForecastMm', type: 'number', required: false, label: 'Dự báo mưa', unit: 'mm' },
  { name: 'zoneType', type: 'string', required: true, label: 'Loại khu' },
  { name: 'soilMoisture', type: 'number', required: true, label: 'Độ ẩm đất', unit: '%' },
  { name: 'airTemp', type: 'number', required: true, label: 'Nhiệt độ', unit: '°C' },
];

const irrigationOutputs: OutputField[] = [
  { name: 'action', type: 'string', label: 'Lệnh' },
  { name: 'durationMin', type: 'number', label: 'Thời lượng', unit: 'phút' },
  { name: 'reason', type: 'string', label: 'Lý do' },
];

const irrigationV4: RuleSet = {
  hitPolicy: 'FIRST',
  inputs: irrigationInputs,
  outputs: irrigationOutputs,
  rules: [
    rule('TANK-LOW', 'Bồn gần cạn thì báo động, không mở van', { tankLevel: '< 10' }, { action: 'ALERT_TANK_LOW', durationMin: 0, reason: 'Bồn chứa gần cạn' }),
    rule('RAIN-SOON', 'Ngoài đồng sắp mưa thì chờ', { rainForecastMm: '>= 5', zoneType: 'OPEN_FIELD' }, { action: 'HOLD', durationMin: 0, reason: 'Sắp có mưa' }),
    rule('HEAT-DRY', 'Đất khô và nắng nóng: tưới dài', { soilMoisture: '< 25', airTemp: '>= 34' }, { action: 'OPEN_VALVE', durationMin: 15, reason: 'Khô hạn, nắng nóng' }),
    rule('DRY', 'Đất khô: tưới ngắn', { soilMoisture: '< 35' }, { action: 'OPEN_VALVE', durationMin: 10, reason: 'Độ ẩm thấp' }),
    rule('SOAKED', 'Đất bão hoà thì đóng van', { soilMoisture: '>= 70' }, { action: 'CLOSE_VALVE', durationMin: 0, reason: 'Đất bão hoà' }),
    rule('DEFAULT', 'Mặc định: không tưới', {}, { action: 'HOLD', durationMin: 0, reason: 'Không cần tưới' }),
  ],
};

const irrigationDraft: RuleSet = clone(irrigationV4);
irrigationDraft.rules[2] = rule(
  'HEAT-DRY',
  'Đất khô và nắng nóng: tưới dài',
  { soilMoisture: '< 25', airTemp: '>= 32' },
  { action: 'OPEN_VALVE', durationMin: 20, reason: 'Khô hạn, nắng nóng' },
);

const irrigationTests: TestCase[] = [
  {
    id: 'TI-01',
    name: 'Bồn cạn giữa trưa',
    facts: { tankLevel: 6, rainForecastMm: 0, zoneType: 'OPEN_FIELD', soilMoisture: 20, airTemp: 36 },
    expected: { outputs: [{ action: 'ALERT_TANK_LOW', durationMin: 0, reason: 'Bồn chứa gần cạn' }] },
  },
  {
    id: 'TI-02',
    name: 'Nắng 33 °C, đất khô',
    facts: { tankLevel: 80, rainForecastMm: 0, zoneType: 'GREENHOUSE', soilMoisture: 22, airTemp: 33 },
    expected: { outputs: [{ action: 'OPEN_VALVE', durationMin: 20, reason: 'Khô hạn, nắng nóng' }] },
  },
  {
    id: 'TI-03',
    name: 'Ngoài đồng sắp mưa',
    facts: { tankLevel: 70, rainForecastMm: 12, zoneType: 'OPEN_FIELD', soilMoisture: 30, airTemp: 29 },
    expected: { outputs: [{ action: 'HOLD', durationMin: 0, reason: 'Sắp có mưa' }] },
  },
  {
    id: 'TI-04',
    name: 'Nhà kính, cảm biến mưa mất tín hiệu',
    facts: { tankLevel: 60, zoneType: 'GREENHOUSE', soilMoisture: 75, airTemp: 27 },
    expected: { outputs: [{ action: 'CLOSE_VALVE', durationMin: 0, reason: 'Đất bão hoà' }] },
  },
  {
    id: 'TI-05',
    name: 'Điều kiện bình thường',
    facts: { tankLevel: 70, rainForecastMm: 0, zoneType: 'OPEN_FIELD', soilMoisture: 50, airTemp: 28 },
    expected: { outputs: [{ action: 'HOLD', durationMin: 0, reason: 'Không cần tưới' }] },
  },
];

// ---------------- classify-customer-tier (UNIQUE) ----------------

const tierInputs: InputField[] = [
  { name: 'annualSpend', type: 'number', required: true, label: 'Chi tiêu 12 tháng', unit: '₫' },
  { name: 'ordersLast12m', type: 'number', required: true, label: 'Số đơn 12 tháng' },
];
const tierOutputs: OutputField[] = [{ name: 'tier', type: 'string', label: 'Hạng' }];

const tierV2: RuleSet = {
  hitPolicy: 'UNIQUE',
  inputs: tierInputs,
  outputs: tierOutputs,
  rules: [
    rule('STANDARD', 'Dưới 5 triệu', { annualSpend: '< 5000000' }, { tier: 'STANDARD' }),
    rule('SILVER', 'Từ 5 đến dưới 20 triệu', { annualSpend: '[5000000..20000000)' }, { tier: 'SILVER' }),
    rule('GOLD', 'Từ 20 triệu', { annualSpend: '>= 20000000' }, { tier: 'GOLD' }),
  ],
};

const tierDraft: RuleSet = clone(tierV2);
tierDraft.rules[2] = rule('GOLD', 'Từ 15 triệu và ít nhất 12 đơn', { annualSpend: '>= 15000000', ordersLast12m: '>= 12' }, { tier: 'GOLD' });

const tierTests: TestCase[] = [
  { id: 'TT-01', name: 'Khách mới', facts: { annualSpend: 3000000, ordersLast12m: 4 }, expected: { outputs: [{ tier: 'STANDARD' }] } },
  { id: 'TT-02', name: 'Khách quen', facts: { annualSpend: 8000000, ordersLast12m: 5 }, expected: { outputs: [{ tier: 'SILVER' }] } },
  { id: 'TT-03', name: '18 triệu, 15 đơn', facts: { annualSpend: 18000000, ordersLast12m: 15 }, expected: { outputs: [{ tier: 'GOLD' }] } },
  { id: 'TT-04', name: '25 triệu, 30 đơn', facts: { annualSpend: 25000000, ordersLast12m: 30 }, expected: { outputs: [{ tier: 'GOLD' }] } },
];

// ---------------- determine-alert-level (PRIORITY) ----------------

const alertV3: RuleSet = {
  hitPolicy: 'PRIORITY',
  inputs: [
    { name: 'sensorOfflineMin', type: 'number', required: false, label: 'Mất tín hiệu', unit: 'phút' },
    { name: 'tankLevel', type: 'number', required: true, label: 'Mực bồn', unit: '%' },
    { name: 'airTemp', type: 'number', required: true, label: 'Nhiệt độ', unit: '°C' },
    { name: 'soilMoisture', type: 'number', required: true, label: 'Độ ẩm đất', unit: '%' },
  ],
  outputs: [
    { name: 'level', type: 'string', label: 'Mức' },
    { name: 'message', type: 'string', label: 'Thông báo' },
  ],
  rules: [
    rule('OFFLINE', 'Cảm biến mất kết nối lâu', { sensorOfflineMin: '>= 30' }, { level: 'CRITICAL', message: 'Cảm biến mất kết nối' }, 100),
    rule('TANK', 'Bồn gần cạn', { tankLevel: '< 10' }, { level: 'CRITICAL', message: 'Bồn gần cạn' }, 90),
    rule('HEAT', 'Nắng nóng gay gắt', { airTemp: '>= 38' }, { level: 'WARNING', message: 'Nắng nóng gay gắt' }, 50),
    rule('DRY', 'Đất rất khô', { soilMoisture: '< 20' }, { level: 'WARNING', message: 'Đất rất khô' }, 40),
    rule('OK', 'Bình thường', {}, { level: 'INFO', message: 'Bình thường' }, 0),
  ],
};

const alertTests: TestCase[] = [
  {
    id: 'TA-01',
    name: 'Nóng và bồn cạn cùng lúc',
    facts: { tankLevel: 5, airTemp: 39, soilMoisture: 30 },
    expected: { outputs: [{ level: 'CRITICAL', message: 'Bồn gần cạn' }] },
  },
  {
    id: 'TA-02',
    name: 'Đất khô, trời mát',
    facts: { tankLevel: 60, airTemp: 26, soilMoisture: 15 },
    expected: { outputs: [{ level: 'WARNING', message: 'Đất rất khô' }] },
  },
  {
    id: 'TA-03',
    name: 'Mọi chỉ số ổn',
    facts: { sensorOfflineMin: 0, tankLevel: 60, airTemp: 30, soilMoisture: 45 },
    expected: { outputs: [{ level: 'INFO', message: 'Bình thường' }] },
  },
];

// ---------------- the store ----------------

export function seed(): Record<string, DecisionRecord> {
  return {
    'calculate-pos-discounts': {
      id: 'calculate-pos-discounts',
      title: 'Chiết khấu giỏ hàng POS',
      domain: 'Retail POS',
      latest: 7,
      versions: versions('calculate-pos-discounts', [
        { note: 'Bản đầu tiên', publishedAt: '2026-06-02T09:10:00+07:00' },
        { note: 'Thêm GOLD5', publishedAt: '2026-06-20T14:00:00+07:00' },
        { note: 'Ngưỡng giỏ lớn 1.500.000 ₫', publishedAt: '2026-07-04T10:30:00+07:00' },
        { note: 'Thêm BEV2', publishedAt: '2026-07-18T16:45:00+07:00' },
        { note: 'Sửa mô tả BEV2', publishedAt: '2026-08-01T08:20:00+07:00' },
        { note: 'Ngưỡng giỏ lớn 1.200.000 ₫', publishedAt: '2026-08-29T11:05:00+07:00', ruleSet: posV6 },
        { note: 'Thêm ưu đãi cuối tuần WKND', publishedAt: '2026-09-30T17:40:00+07:00', ruleSet: posV7 },
      ]),
      drafts: [
        {
          id: 'draft-3',
          decisionId: 'calculate-pos-discounts',
          title: 'Hạ ngưỡng giỏ lớn, thêm ưu đãi online',
          baseVersion: 6,
          updatedAt: '2026-10-06T15:12:00+07:00',
          ruleSet: posDraft,
        },
      ],
      testCases: posTests,
    },
    'determine-irrigation-action': {
      id: 'determine-irrigation-action',
      title: 'Lệnh tưới theo vi khí hậu',
      domain: 'Smart IoT Irrigation',
      latest: 4,
      versions: versions('determine-irrigation-action', [
        { note: 'Bản đầu tiên', publishedAt: '2026-05-12T07:00:00+07:00' },
        { note: 'Thêm RAIN-SOON', publishedAt: '2026-06-03T07:30:00+07:00' },
        { note: 'Tách nhà kính / ngoài đồng', publishedAt: '2026-07-21T06:50:00+07:00' },
        { note: 'Thêm báo động bồn cạn', publishedAt: '2026-09-02T06:15:00+07:00', ruleSet: irrigationV4 },
      ]),
      drafts: [
        {
          id: 'draft-1',
          decisionId: 'determine-irrigation-action',
          title: 'Tưới sớm hơn khi nắng nóng',
          baseVersion: 4,
          updatedAt: '2026-10-07T09:02:00+07:00',
          ruleSet: irrigationDraft,
        },
      ],
      testCases: irrigationTests,
    },
    'classify-customer-tier': {
      id: 'classify-customer-tier',
      title: 'Phân hạng khách hàng',
      domain: 'Retail POS',
      latest: 2,
      versions: versions('classify-customer-tier', [
        { note: 'Bản đầu tiên', publishedAt: '2026-06-10T13:00:00+07:00' },
        { note: 'Thêm hạng SILVER', publishedAt: '2026-08-14T13:30:00+07:00', ruleSet: tierV2 },
      ]),
      drafts: [
        {
          id: 'draft-2',
          decisionId: 'classify-customer-tier',
          title: 'GOLD theo cả số đơn',
          baseVersion: 2,
          updatedAt: '2026-10-05T10:40:00+07:00',
          ruleSet: tierDraft,
        },
      ],
      testCases: tierTests,
    },
    'determine-alert-level': {
      id: 'determine-alert-level',
      title: 'Mức cảnh báo vườn',
      domain: 'Smart IoT Irrigation',
      latest: 3,
      versions: versions('determine-alert-level', [
        { note: 'Bản đầu tiên', publishedAt: '2026-05-20T08:00:00+07:00' },
        { note: 'Thêm cảnh báo nắng nóng', publishedAt: '2026-07-01T08:00:00+07:00' },
        { note: 'Ưu tiên mất kết nối cảm biến', publishedAt: '2026-08-22T08:00:00+07:00', ruleSet: alertV3 },
      ]),
      drafts: [],
      testCases: alertTests,
    },
  };
}
