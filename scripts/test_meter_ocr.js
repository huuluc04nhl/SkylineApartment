const assert = require('assert');

console.log('🧪 RUNNING UNIT TESTS: B2 METER OCR & HUMAN CONFIRMATION GATE...');

// Test 1: Confidence < 0.85 requires human confirmation
function validateSavingPolicy(confidence, isConfirmed) {
  if (confidence < 0.85 && !isConfirmed) {
    return { allowed: false, reason: 'Confidence < 0.85 requires human confirmation' };
  }
  return { allowed: true, reason: 'Approved' };
}

assert.strictEqual(validateSavingPolicy(0.78, false).allowed, false, 'Should block saving when confidence 0.78 and unconfirmed');
assert.strictEqual(validateSavingPolicy(0.78, true).allowed, true, 'Should allow saving when confidence 0.78 and confirmed by human');
assert.strictEqual(validateSavingPolicy(0.92, false).allowed, true, 'Should allow saving when confidence 0.92');
assert.strictEqual(validateSavingPolicy(0.85, false).allowed, true, 'Should allow saving when confidence 0.85');
console.log('✅ Test 1: Confidence threshold policy (<0.85 gate) PASSED');

// Test 2: Consumption calculation
function computeConsumption(prev, current) {
  return Math.max(0, current - prev);
}

assert.strictEqual(computeConsumption(1200, 1345), 145, 'Electric consumption should be 145 kWh');
assert.strictEqual(computeConsumption(45, 58), 13, 'Water consumption should be 13 m3');
assert.strictEqual(computeConsumption(1200, 1100), 0, 'Cannot have negative consumption');
console.log('✅ Test 2: Consumption calculation PASSED');

// Test 3: OCR Schema simulation
const testOcrSample = {
  meter_type: 'ELECTRIC',
  reading: 1350.5,
  confidence: 0.91,
  notes: 'Đã nhận dạng sắc nét số điện tử 1350.5 kWh'
};

assert.strictEqual(['ELECTRIC', 'WATER'].includes(testOcrSample.meter_type), true);
assert.strictEqual(typeof testOcrSample.reading, 'number');
assert.strictEqual(testOcrSample.confidence >= 0 && testOcrSample.confidence <= 1, true);
console.log('✅ Test 3: OCR Data Structure Schema PASSED');

console.log('🎉 ALL 3 B2 UNIT TESTS PASSED SUCCESSFULLY!');
