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

  it('supports flexible speed aliases including mi/h output', () => {
    expect(buildDeterministicCalculation('9km/h to mi/h')?.title).toBe('9 km/h = 5.59 mi/h');
    expect(buildDeterministicCalculation('30 mph to kmh')?.title).toBe('30 mi/h = 48.28 km/h');
  });

  it('supports time duration conversions', () => {
    expect(buildDeterministicCalculation('90 min to h')?.title).toBe('90 min = 1.5 h');
    expect(buildDeterministicCalculation('2 weeks to d')?.title).toBe('2 week = 14 d');
  });

  it('supports data size conversions', () => {
    expect(buildDeterministicCalculation('2048 mb to gb')?.title).toBe('2048 MB = 2 GB');
    expect(buildDeterministicCalculation('1 gbit to mbit')?.title).toBe('1 Gb = 1024 Mb');
  });

  it('supports volume conversions', () => {
    expect(buildDeterministicCalculation('500ml to cup')?.title).toBe('500 ml = 2.11 cup');
    expect(buildDeterministicCalculation('2 tbsp to ml')?.title).toBe('2 tbsp = 29.57 ml');
  });

  it('supports temperature conversions', () => {
    expect(buildDeterministicCalculation('40F to C')?.title).toBe('40 °F = 4.44 °C');
    expect(buildDeterministicCalculation('273.15K to F')?.title).toBe('273.15 K = 32 °F');
  });
});

describe('buildDeterministicResult', () => {
  it('builds implicit metric-imperial suggestions when a compact unit is typed', () => {
    const results = buildDeterministicResult('30cm');
    expect(results.map((result) => result.title)).toContain('30 cm = 11.81 in');
    expect(results.map((result) => result.title)).toContain('30 cm = 0.98 ft');
  });

  it('suggests quick temperature conversions before the query is complete', () => {
    const results = buildDeterministicResult('40F');
    expect(results[0]?.title).toBe('40 °F = 4.44 °C');
  });

  it('suggests quick currency conversions before the query is complete', () => {
    const results = buildDeterministicResult('20USD');
    expect(results.map((result) => result.title)).toContain('20 USD = 18.4 EUR');
    expect(results.map((result) => result.title)).toContain('20 USD = 15.6 GBP');
    expect(results.map((result) => result.title)).toContain('20 USD = 2988 JPY');
  });

  it('suggests duration conversions from compact tokens', () => {
    const results = buildDeterministicResult('90min');
    expect(results.map((result) => result.title)).toContain('90 min = 1.5 h');
    expect(results.map((result) => result.title)).toContain('90 min = 5400 s');
  });

  it('suggests data size conversions from compact tokens', () => {
    const results = buildDeterministicResult('2048MB');
    expect(results.map((result) => result.title)).toContain('2048 MB = 2 GB');
    expect(results.map((result) => result.title)).toContain('2048 MB = 2097152 KB');
  });

  it('suggests volume conversions from compact tokens', () => {
    const results = buildDeterministicResult('500ml');
    expect(results.map((result) => result.title)).toContain('500 ml = 16.91 fl oz');
    expect(results.map((result) => result.title)).toContain('500 ml = 2.11 cup');
  });

  it('covers the full quick-conversion matrix for common units', () => {
    const quickCases = [
      ['30cm', ['in', 'ft']],
      ['2m', ['ft', 'yd']],
      ['9km', ['mi']],
      ['5mi', ['km']],
      ['12in', ['cm']],
      ['6ft', ['m']],
      ['4yd', ['m']],
      ['70kg', ['lb']],
      ['155lb', ['kg']],
      ['16oz', ['g']],
      ['500g', ['oz']],
      ['25m2', ['ft2']],
      ['300ft2', ['m2']],
      ['40F', ['°C']],
      ['20C', ['°F']],
      ['300K', ['°C', '°F']],
      ['9km/h', ['mi/h']],
      ['55mph', ['km/h']],
      ['750ms', ['s']],
      ['45s', ['ms', 'min']],
      ['90min', ['h', 's']],
      ['2h', ['min']],
      ['3d', ['h']],
      ['2week', ['d']],
      ['2month', ['d']],
      ['1year', ['d']],
      ['1024B', ['KB', 'MB']],
      ['64KB', ['MB']],
      ['2048MB', ['GB', 'KB']],
      ['5GB', ['TB', 'MB']],
      ['2Tb', ['GB']],
      ['8bit', ['B']],
      ['500ml', ['fl oz', 'cup']],
      ['2l', ['qt', 'gal']],
      ['3tsp', ['ml']],
      ['2tbsp', ['ml']],
      ['2cup', ['ml', 'fl oz']],
      ['1pint', ['ml', 'l']],
      ['2qt', ['l']],
      ['1gal', ['l']],
      ['20USD', ['EUR', 'GBP', 'JPY']],
      ['20EUR', ['USD', 'GBP']],
      ['20GBP', ['USD', 'EUR']],
      ['5000JPY', ['USD', 'EUR']]
    ] as const;

    for (const [query, fragments] of quickCases) {
      const titles = buildDeterministicResult(query).map((result) => result.title);
      expect(titles.length, `expected suggestions for ${query}`).toBeGreaterThan(0);
      for (const fragment of fragments) {
        expect(titles.some((title) => title.includes(fragment)), `expected ${query} to include ${fragment} in ${titles.join(' | ')}`).toBe(true);
      }
    }
  });
});
