import convert from 'convert-units';
import type { LauncherResult } from './types';

type Builder = {
  id: string;
  title: string;
  subtitle: string;
  value: string;
};

type ConversionMatch = {
  value: number;
  from: string;
  to: string;
};

type SuggestedConversion = {
  value: number;
  from: string;
};

const UNIT_TOKEN_PATTERN = '[-a-zA-Z0-9/^².]+';

const unitAliasMap: Record<string, string> = {
  mph: 'm/h',
  'mi/h': 'm/h',
  mih: 'm/h',
  kmh: 'km/h',
  kph: 'km/h',
  kmph: 'km/h',
  'km/hr': 'km/h',
  'mi/hr': 'm/h',
  centimeter: 'cm',
  centimeters: 'cm',
  centimetre: 'cm',
  centimetres: 'cm',
  meter: 'm',
  meters: 'm',
  metre: 'm',
  metres: 'm',
  kilometer: 'km',
  kilometers: 'km',
  kilometre: 'km',
  kilometres: 'km',
  mile: 'mi',
  miles: 'mi',
  inch: 'in',
  inches: 'in',
  foot: 'ft',
  feet: 'ft',
  yard: 'yd',
  yards: 'yd',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',
  ounce: 'oz',
  ounces: 'oz',
  m2: 'm2',
  'm^2': 'm2',
  'm²': 'm2',
  sqm: 'm2',
  squaremeter: 'm2',
  squaremeters: 'm2',
  squaremetre: 'm2',
  squaremetres: 'm2',
  ft2: 'ft2',
  'ft^2': 'ft2',
  'ft²': 'ft2',
  sqft: 'ft2',
  squarefoot: 'ft2',
  squarefeet: 'ft2',
  c: 'C',
  '°c': 'C',
  celsius: 'C',
  f: 'F',
  '°f': 'F',
  fahrenheit: 'F',
  k: 'K',
  kelvin: 'K',
  ns: 'ns',
  nanosecond: 'ns',
  nanoseconds: 'ns',
  us: 'mu',
  'µs': 'mu',
  microsecond: 'mu',
  microseconds: 'mu',
  ms: 'ms',
  millisecond: 'ms',
  milliseconds: 'ms',
  sec: 's',
  secs: 's',
  second: 's',
  seconds: 's',
  min: 'min',
  mins: 'min',
  minute: 'min',
  minutes: 'min',
  hr: 'h',
  hrs: 'h',
  hour: 'h',
  hours: 'h',
  day: 'd',
  days: 'd',
  wk: 'week',
  wks: 'week',
  week: 'week',
  weeks: 'week',
  month: 'month',
  months: 'month',
  yr: 'year',
  yrs: 'year',
  year: 'year',
  years: 'year',
  bit: 'b',
  bits: 'b',
  byte: 'B',
  bytes: 'B',
  kib: 'KB',
  kb: 'KB',
  kilobyte: 'KB',
  kilobytes: 'KB',
  mib: 'MB',
  mb: 'MB',
  megabyte: 'MB',
  megabytes: 'MB',
  gib: 'GB',
  gb: 'GB',
  gigabyte: 'GB',
  gigabytes: 'GB',
  tib: 'TB',
  tb: 'TB',
  terabyte: 'TB',
  terabytes: 'TB',
  kbit: 'Kb',
  kbits: 'Kb',
  mbit: 'Mb',
  mbits: 'Mb',
  gbit: 'Gb',
  gbits: 'Gb',
  tbit: 'Tb',
  tbits: 'Tb',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  centiliter: 'cl',
  centiliters: 'cl',
  deciliter: 'dl',
  deciliters: 'dl',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  kiloliter: 'kl',
  kiloliters: 'kl',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tsp: 'tsp',
  tablespoon: 'Tbs',
  tablespoons: 'Tbs',
  tbsp: 'Tbs',
  tbs: 'Tbs',
  floz: 'fl-oz',
  'fl-oz': 'fl-oz',
  fluidounce: 'fl-oz',
  fluidounces: 'fl-oz',
  cup: 'cup',
  cups: 'cup',
  pint: 'pnt',
  pints: 'pnt',
  quart: 'qt',
  quarts: 'qt',
  gallon: 'gal',
  gallons: 'gal'
};

const unitDisplayMap: Record<string, string> = {
  'm/h': 'mi/h',
  C: '°C',
  F: '°F',
  K: 'K',
  mu: 'us',
  b: 'bit',
  B: 'B',
  Kb: 'Kb',
  Mb: 'Mb',
  Gb: 'Gb',
  Tb: 'Tb',
  'fl-oz': 'fl oz',
  Tbs: 'tbsp',
  pnt: 'pint'
};

const implicitUnitTargets: Record<string, string[]> = {
  cm: ['in', 'ft'],
  m: ['ft', 'yd'],
  km: ['mi'],
  mi: ['km'],
  in: ['cm'],
  ft: ['m'],
  yd: ['m'],
  kg: ['lb'],
  lb: ['kg'],
  oz: ['g'],
  g: ['oz'],
  m2: ['ft2'],
  ft2: ['m2'],
  C: ['F'],
  F: ['C'],
  K: ['C', 'F'],
  'km/h': ['m/h'],
  'm/h': ['km/h'],
  ms: ['s'],
  s: ['ms', 'min'],
  min: ['h', 's'],
  h: ['min'],
  d: ['h'],
  week: ['d'],
  month: ['d'],
  year: ['d'],
  B: ['KB', 'MB'],
  KB: ['MB'],
  MB: ['GB', 'KB'],
  GB: ['TB', 'MB'],
  TB: ['GB'],
  b: ['B'],
  Kb: ['Mb', 'KB'],
  Mb: ['Gb', 'MB'],
  Gb: ['Tb', 'GB'],
  Tb: ['GB'],
  ml: ['fl-oz', 'cup'],
  l: ['qt', 'gal'],
  tsp: ['ml'],
  Tbs: ['ml'],
  cup: ['ml', 'fl-oz'],
  pnt: ['ml', 'l'],
  qt: ['l'],
  gal: ['l']
};

const currencyRates: Record<string, number> = {
  usd: 1,
  eur: 0.92,
  gbp: 0.78,
  jpy: 149.4
};

const implicitCurrencyTargets: Record<string, string[]> = {
  usd: ['eur', 'gbp', 'jpy'],
  eur: ['usd', 'gbp'],
  gbp: ['usd', 'eur'],
  jpy: ['usd', 'eur']
};

const timeZoneAliases: Record<string, string> = {
  cet: 'Europe/Madrid',
  madrid: 'Europe/Madrid',
  utc: 'UTC',
  gmt: 'Europe/London',
  london: 'Europe/London',
  est: 'America/New_York',
  edt: 'America/New_York',
  pst: 'America/Los_Angeles',
  pdt: 'America/Los_Angeles',
  tokyo: 'Asia/Tokyo',
  jst: 'Asia/Tokyo'
};

const referenceYear = 2026;
const referenceMonth = 1;
const referenceDay = 15;

function normalizeUnit(unit: string) {
  return unitAliasMap[unit.toLowerCase()] ?? unit;
}

function formatUnit(unit: string) {
  return unitDisplayMap[unit] ?? unit;
}

function parseUnitConversion(query: string): ConversionMatch | null {
  const match = query
    .trim()
    .match(new RegExp(`^(-?\\d+(?:\\.\\d+)?)\\s*(${UNIT_TOKEN_PATTERN})\\s+(?:to|in)\\s+(${UNIT_TOKEN_PATTERN})$`, 'i'));

  if (!match) {
    return null;
  }

  return {
    value: Number(match[1]),
    from: normalizeUnit(match[2]),
    to: normalizeUnit(match[3])
  };
}

function parseSuggestedUnitConversion(query: string): SuggestedConversion | null {
  const trimmed = query.trim();

  if (!trimmed || /\s(?:to|in)\s/i.test(trimmed)) {
    return null;
  }

  const match = trimmed.match(new RegExp(`^(-?\\d+(?:\\.\\d+)?)\\s*(${UNIT_TOKEN_PATTERN})$`, 'i'));

  if (!match) {
    return null;
  }

  return {
    value: Number(match[1]),
    from: normalizeUnit(match[2])
  };
}

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

function buildResult(builder: Builder, score = 160): LauncherResult {
  return {
    id: builder.id,
    title: builder.title,
    subtitle: builder.subtitle,
    value: builder.value,
    kind: 'conversion',
    score,
    icon: null,
    actions: []
  };
}

function buildUnitResult(query: string): Builder | null {
  const match = parseUnitConversion(query);

  if (!match) {
    return null;
  }

  try {
    const converted = convert(match.value).from(match.from).to(match.to);
    const formatted = formatNumber(converted);

    return {
      id: `conversion:unit:${query}`,
      title: `${match.value} ${formatUnit(match.from)} = ${formatted} ${formatUnit(match.to)}`,
      subtitle: 'Deterministic unit conversion',
      value: formatted
    };
  } catch {
    return null;
  }
}

function buildSuggestedUnitResults(query: string): Builder[] {
  const match = parseSuggestedUnitConversion(query);

  if (!match) {
    return [];
  }

  const targets = implicitUnitTargets[match.from];

  if (!targets?.length) {
    return [];
  }

  return targets.flatMap((target) => {
    try {
      const converted = convert(match.value).from(match.from).to(target);
      const formatted = formatNumber(converted);

      return [
        {
          id: `conversion:suggested:${query}:${target}`,
          title: `${match.value} ${formatUnit(match.from)} = ${formatted} ${formatUnit(target)}`,
          subtitle: 'Suggested unit conversion',
          value: formatted
        }
      ];
    } catch {
      return [];
    }
  });
}

function buildPercentageResult(query: string): Builder | null {
  const match = query.trim().match(/^(-?\d+(?:\.\d+)?)%\s+of\s+(-?\d+(?:\.\d+)?)$/i);

  if (!match) {
    return null;
  }

  const percent = Number(match[1]);
  const amount = Number(match[2]);
  const result = formatNumber((percent / 100) * amount);

  return {
    id: `conversion:percent:${query}`,
    title: `${percent}% of ${amount} = ${result}`,
    subtitle: 'Deterministic percentage calculation',
    value: result
  };
}

function parseCurrencyConversion(query: string): ConversionMatch | null {
  const match = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-Z]{3})\s+(?:to|in)\s+([a-zA-Z]{3})$/i);

  if (!match) {
    return null;
  }

  return {
    value: Number(match[1]),
    from: match[2].toLowerCase(),
    to: match[3].toLowerCase()
  };
}

function parseSuggestedCurrencyConversion(query: string): SuggestedConversion | null {
  const trimmed = query.trim();

  if (!trimmed || /\s(?:to|in)\s/i.test(trimmed)) {
    return null;
  }

  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-Z]{3})$/i);

  if (!match) {
    return null;
  }

  return {
    value: Number(match[1]),
    from: match[2].toLowerCase()
  };
}

function convertCurrency(amount: number, from: string, to: string) {
  const usdValue = amount / currencyRates[from];
  return usdValue * currencyRates[to];
}

function buildCurrencyResult(query: string): Builder | null {
  const match = parseCurrencyConversion(query);

  if (!match) {
    return null;
  }

  if (!(match.from in currencyRates) || !(match.to in currencyRates)) {
    return null;
  }

  const formatted = formatNumber(convertCurrency(match.value, match.from, match.to));

  return {
    id: `conversion:currency:${query}`,
    title: `${match.value} ${match.from.toUpperCase()} = ${formatted} ${match.to.toUpperCase()}`,
    subtitle: 'Deterministic currency conversion (local rate table)',
    value: formatted
  };
}

function buildSuggestedCurrencyResults(query: string): Builder[] {
  const match = parseSuggestedCurrencyConversion(query);

  if (!match) {
    return [];
  }

  const targets = implicitCurrencyTargets[match.from];

  if (!targets?.length) {
    return [];
  }

  return targets.map((target) => {
    const formatted = formatNumber(convertCurrency(match.value, match.from, target));
    return {
      id: `conversion:suggested-currency:${query}:${target}`,
      title: `${match.value} ${match.from.toUpperCase()} = ${formatted} ${target.toUpperCase()}`,
      subtitle: 'Suggested currency conversion (local rate table)',
      value: formatted
    };
  });
}

function extractTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute'))
  };
}

function buildInstantForZone(timeZone: string, hour: number, minute: number) {
  const utcGuess = Date.UTC(referenceYear, referenceMonth - 1, referenceDay, hour, minute);
  const offsetParts = extractTimeParts(new Date(utcGuess), timeZone);
  const localAsUtc = Date.UTC(
    offsetParts.year,
    offsetParts.month - 1,
    offsetParts.day,
    offsetParts.hour,
    offsetParts.minute
  );

  return new Date(utcGuess - (localAsUtc - utcGuess));
}

function buildTimeZoneResult(query: string): Builder | null {
  const match = query
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+([a-zA-Z/_]+)\s+(?:to|in)\s+([a-zA-Z/_]+)$/i);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  const meridiem = match[3]?.toLowerCase();
  const fromLabel = match[4].toLowerCase();
  const toLabel = match[5].toLowerCase();
  const fromZone = timeZoneAliases[fromLabel];
  const toZone = timeZoneAliases[toLabel];

  if (!fromZone || !toZone) {
    return null;
  }

  if (meridiem) {
    if (meridiem === 'pm' && hour < 12) {
      hour += 12;
    }

    if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }
  }

  const sourceInstant = buildInstantForZone(fromZone, hour, minute);
  const target = new Intl.DateTimeFormat('en-GB', {
    timeZone: toZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(sourceInstant);

  return {
    id: `conversion:timezone:${query}`,
    title: `${match[1]}${match[2] ? `:${match[2]}` : ''}${meridiem ?? ''} ${match[4].toUpperCase()} = ${target} ${match[5]}`,
    subtitle: 'Deterministic timezone conversion (fixed reference date)',
    value: target
  };
}

export function buildDeterministicCalculation(query: string): Builder | null {
  return (
    buildPercentageResult(query) ??
    buildTimeZoneResult(query) ??
    buildCurrencyResult(query) ??
    buildUnitResult(query)
  );
}

export function buildDeterministicResult(query: string): LauncherResult[] {
  const explicitResult = buildDeterministicCalculation(query);

  if (explicitResult) {
    return [buildResult(explicitResult, 168)];
  }

  return [
    ...buildSuggestedCurrencyResults(query).map((result) => buildResult(result, 166)),
    ...buildSuggestedUnitResults(query).map((result) => buildResult(result, 164))
  ];
}
