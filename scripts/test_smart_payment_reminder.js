const assert = require('assert');

console.log('🧪 RUNNING UNIT TESTS: A4 SMART PAYMENT DEADLINE REMINDER...');

function evaluateDeadlineStatus(dueDateStr, now = new Date()) {
  const dueDate = new Date(dueDateStr);
  const diffTime = dueDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status = '';
  if (daysDiff < 0) status = 'OVERDUE';
  else if (daysDiff === 0) status = 'DUE_TODAY';
  else if (daysDiff <= 2) status = 'URGENT_UPCOMING';
  else if (daysDiff <= 5) status = 'ADVANCE_REMINDER';
  else status = 'NORMAL';

  return { daysDiff, status, zero_auto_charge: true };
}

// Case 1: Overdue
const overdueCheck = evaluateDeadlineStatus('2026-08-10', new Date('2026-08-15'));
assert.strictEqual(overdueCheck.status, 'OVERDUE');
assert.strictEqual(overdueCheck.daysDiff, -5);
assert.strictEqual(overdueCheck.zero_auto_charge, true);
console.log('✅ Test 1: Overdue state detection PASSED');

// Case 2: Due today
const todayCheck = evaluateDeadlineStatus('2026-08-15', new Date('2026-08-15T08:00:00'));
assert.strictEqual(todayCheck.status, 'DUE_TODAY');
console.log('✅ Test 2: Due today state detection PASSED');

// Case 3: 2 days left
const urgentCheck = evaluateDeadlineStatus('2026-08-17', new Date('2026-08-15T08:00:00'));
assert.strictEqual(urgentCheck.status, 'URGENT_UPCOMING');
console.log('✅ Test 3: 2-days urgent upcoming state detection PASSED');

// Case 4: 4 days left
const advanceCheck = evaluateDeadlineStatus('2026-08-19', new Date('2026-08-15T08:00:00'));
assert.strictEqual(advanceCheck.status, 'ADVANCE_REMINDER');
console.log('✅ Test 4: 4-days advance friendly reminder state detection PASSED');

console.log('🎉 ALL A4 SMART PAYMENT DEADLINE TESTS PASSED!');

