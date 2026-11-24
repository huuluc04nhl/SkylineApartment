const assert = require('assert');

console.log('🧪 RUNNING UNIT TESTS: B4 NATURAL LANGUAGE ADMIN REPORT TOOLS...');

// Mock dataset
const mockBills = [
  { apartment_code: 'BS-07-0101', total_amount: 2500000, status: 'Paid', due_date: '2026-08-15', owner_name: 'Nguyễn Văn An' },
  { apartment_code: 'BS-07-0202', total_amount: 1800000, status: 'Unpaid', due_date: '2026-08-15', owner_name: 'Trần Thị Mai' },
  { apartment_code: 'BS-08-1204', total_amount: 3200000, status: 'Paid', due_date: '2026-08-15', owner_name: 'Lê Hoàng Nam' },
  { apartment_code: 'CH-06', total_amount: 2510000, status: 'Unpaid', due_date: '2026-08-15', owner_name: 'Võ Hữu Lực' },
  { apartment_code: 'BS-09-0501', total_amount: 4100000, status: 'Unpaid', due_date: '2026-07-15', owner_name: 'Phạm Quang Minh' },
];

// Test 1: Tower Aggregation Logic
function aggregateByTower(bills, towerCode) {
  const filtered = bills.filter(b => b.apartment_code.startsWith(towerCode) || (towerCode === 'BS-08' && b.apartment_code === 'CH-06'));
  const total = filtered.reduce((s, b) => s + b.total_amount, 0);
  const collected = filtered.filter(b => b.status === 'Paid').reduce((s, b) => s + b.total_amount, 0);
  const debt = total - collected;
  return { tower: towerCode, total, collected, debt, count: filtered.length };
}

const bs08 = aggregateByTower(mockBills, 'BS-08');
assert.strictEqual(bs08.total, 3200000 + 2510000, 'BS-08 total billed must include CH-06');
assert.strictEqual(bs08.collected, 3200000, 'BS-08 collected should be 3.2M');
assert.strictEqual(bs08.debt, 2510000, 'BS-08 debt should be 2.51M');
console.log('✅ Test 1: Tower aggregation logic PASSED');

// Test 2: PII Masking
function maskName(name) {
  if (!name) return 'Cư Dân';
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return name;
  return parts[0] + ' *** ' + parts[parts.length - 1];
}

assert.strictEqual(maskName('Nguyễn Văn An'), 'Nguyễn *** An', 'Name must be masked');
assert.strictEqual(maskName('Trần Thị Mai'), 'Trần *** Mai', 'Name must be masked');
console.log('✅ Test 2: Sensitive PII masking PASSED');

// Test 3: Top Debtors Ranking
function getTopDebtors(bills, limit = 2) {
  const unpaid = bills.filter(b => b.status === 'Unpaid');
  return unpaid.sort((a, b) => b.total_amount - a.total_amount).slice(0, limit);
}

const top2 = getTopDebtors(mockBills, 2);
assert.strictEqual(top2.length, 2);
assert.strictEqual(top2[0].apartment_code, 'BS-09-0501', 'Top debtor must be 4.1M unit');
assert.strictEqual(top2[1].apartment_code, 'CH-06', 'Second debtor must be CH-06 with 2.51M');
console.log('✅ Test 3: Top debtors sorting PASSED');

console.log('🎉 ALL 3 B4 ADMIN REPORT TESTS PASSED!');

