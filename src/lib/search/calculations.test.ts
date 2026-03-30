import { describe, expect, it } from 'vitest';
import { buildDeterministicCalculation, buildDeterministicResult } from './calculations';

describe('buildDeterministicCalculation', () => {
  it('builds percentage calculations', () => {
    expect(buildDeterministicCalculation('15% of 240')?.value).toBe('36');
  });

  it('builds timezone conversions', () => {
    const result = buildDeterministicCalculation('2pm CET in Tokyo');
    expect(result?.title).toContain('Tokyo');
    expect(result?.value).toBeTruthy();
  });

  it('builds currency conversions from local rates', () => {
    expect(buildDeterministicCalculation('45 usd to eur')?.title).toContain('EUR');
  });

  it('builds implicit metric-imperial suggestions when a compact unit is typed', () => {
    const results = buildDeterministicResult('30cm');
    expect(results.map((result) => result.title)).toContain('30 cm = 11.81 in');
    expect(results.map((result) => result.title)).toContain('30 cm = 0.98 ft');
  });
});
