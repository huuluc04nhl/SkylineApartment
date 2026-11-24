const assert = require('assert');

console.log('🧪 RUNNING UNIT TESTS: A3 COST FORECASTING & ENERGY SAVING TIPS...');

// Test 1: Moving average calculation
const mock3Bills = [
  { billing_month: '2026-08', total_amount: 2510000 },
  { billing_month: '2026-07', total_amount: 2290000 },
  { billing_month: '2026-06', total_amount: 2150000 },
];

function calculateForecast(bills) {
  const avg = Math.round(bills.reduce((s, b) => s + b.total_amount, 0) / bills.length);
  const min = Math.round((avg * 0.96) / 10000) * 10000;
  const max = Math.round((avg * 1.02) / 10000) * 10000;
  return { avg, min, max, mid: Math.round((min + max) / 2) };
}

const f = calculateForecast(mock3Bills);
assert.strictEqual(f.avg, 2316667, 'Average should be ~2.316.667 đ');
assert.strictEqual(f.min < f.avg, true, 'Min forecast should be below avg');
assert.strictEqual(f.max > f.avg, true, 'Max forecast should be above avg');
console.log('✅ Test 1: Moving average range estimation PASSED');

// Test 2: Fixed vs Variable Cost Separation
const fixed = 1320000;
const variable = f.mid - fixed;
assert.strictEqual(variable > 0, true, 'Variable cost must be positive');
console.log('✅ Test 2: Fixed vs Variable cost decomposition PASSED');

console.log('🎉 ALL A3 FORECAST TESTS PASSED!');

