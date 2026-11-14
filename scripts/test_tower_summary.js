const assert = require('assert');

console.log('🧪 RUNNING UNIT TESTS: B5 TOWER COLLECTION SUMMARY...');

const towers = ['BS-07', 'BS-08', 'BS-09', 'BS-10'];

const testBills = [
  { apt_code: 'BS-07-0101', total_amount: 2000000, status: 'Paid' },
  { apt_code: 'BS-07-0202', total_amount: 3000000, status: 'Unpaid' },
  { apt_code: 'BS-08-1204', total_amount: 4000000, status: 'Paid' },
  { apt_code: 'CH-06', total_amount: 2500000, status: 'Unpaid' }, // CH-06 is in BS-08
  { apt_code: 'BS-09-0101', total_amount: 1500000, status: 'Paid' },
  { apt_code: 'BS-10-0101', total_amount: 1000000, status: 'Paid' },
];

function summarizeTowers(bills) {
  return towers.map(code => {
    const list = bills.filter(b => b.apt_code.startsWith(code) || (code === 'BS-08' && b.apt_code === 'CH-06'));
    const billed = list.reduce((s, b) => s + b.total_amount, 0);
    const collected = list.filter(b => b.status === 'Paid').reduce((s, b) => s + b.total_amount, 0);
    const debt = billed - collected;
    const rate = billed > 0 ? (collected / billed) * 100 : 0;
    return { code, billed, collected, debt, rate };
  });
}

const stats = summarizeTowers(testBills);

// BS-07: 5M billed, 2M collected (40%), 3M debt
const bs07 = stats.find(t => t.code === 'BS-07');
assert.strictEqual(bs07.billed, 5000000);
assert.strictEqual(bs07.collected, 2000000);
assert.strictEqual(bs07.debt, 3000000);
assert.strictEqual(bs07.rate, 40);
console.log('✅ Test 1: BS-07 tower aggregation PASSED');

// BS-08: 4M + 2.5M = 6.5M billed, 4M collected, 2.5M debt
const bs08 = stats.find(t => t.code === 'BS-08');
assert.strictEqual(bs08.billed, 6500000);
assert.strictEqual(bs08.collected, 4000000);
assert.strictEqual(bs08.debt, 2500000);
console.log('✅ Test 2: BS-08 includes CH-06 PASSED');

// Overall calculation
const totalBilled = stats.reduce((s, t) => s + t.billed, 0);
assert.strictEqual(totalBilled, 14000000);
console.log('✅ Test 3: Total billed across 4 towers PASSED');

console.log('🎉 ALL B5 TOWER COLLECTION TESTS PASSED!');
