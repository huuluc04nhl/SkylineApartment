import { describe, it, expect } from 'vitest';
import {
  calculateZScores,
  detectBillingAnomalies,
  STANDARD_FEE_RATES,
} from '@/lib/billingAnomalyEngine';

describe('billingAnomalyEngine', () => {
  it('computes Z-scores accurately for normal and constant distributions', () => {
    expect(calculateZScores([10])).toEqual([0]);
    expect(calculateZScores([100, 100, 100])).toEqual([0, 0, 0]);
    const scores = calculateZScores([100, 100, 100, 200]);
    expect(scores[3]).toBeGreaterThan(1.5);
  });

  it('detects DUPLICATE_BILL for same apartment and billing month', () => {
    const bills = [
      { id: 'B1', apartment_code: 'CH-06', billing_month: '2026-08', total_amount: 1000000, details: [] },
      { id: 'B2', apartment_code: 'CH-06', billing_month: '2026-08', total_amount: 1000000, details: [] },
    ];
    const anomalies = detectBillingAnomalies(bills, bills);
    expect(anomalies.some((a) => a.category === 'DUPLICATE_BILL' && a.billId === 'B2')).toBe(true);
  });

  it('detects INCORRECT_UNIT_PRICE for water rate deviation', () => {
    const bills = [
      {
        id: 'B-WATER',
        apartment_code: 'BS-07-0101',
        billing_month: '2026-09',
        total_amount: 500000,
        details: [
          {
            service_type: 'Water',
            service_name: 'Nước sinh hoạt',
            usage: 10,
            unit_price: STANDARD_FEE_RATES.WATER_RATE_PER_M3 + 10000,
            total_line_amount: 277000,
          },
          {
            service_type: 'Management',
            service_name: 'Phí quản lý',
            total_line_amount: 900000,
          },
        ],
      },
    ];
    const anomalies = detectBillingAnomalies(bills, bills);
    expect(anomalies.some((a) => a.category === 'INCORRECT_UNIT_PRICE')).toBe(true);
  });

  it('detects MISSING_MANDATORY_FEE when management fee is absent', () => {
    const bills = [
      {
        id: 'B-NOMGMT',
        apartment_code: 'BS-07-0102',
        billing_month: '2026-09',
        total_amount: 200000,
        details: [
          {
            service_type: 'ELECTRIC',
            service_name: 'Điện sinh hoạt',
            usage: 50,
            unit_price: STANDARD_FEE_RATES.ELECTRIC_RATE_ESTIMATE,
            total_line_amount: 132500,
          },
        ],
      },
    ];
    const anomalies = detectBillingAnomalies(bills, bills);
    expect(anomalies.some((a) => a.category === 'MISSING_MANDATORY_FEE')).toBe(true);
  });
});
