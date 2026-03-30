type RankEntry = {
  launches: number;
  lastSelectedAt: number;
};

type RankStore = Record<string, RankEntry>;

const STORAGE_KEY = 'northlight.rank-store';
let memoryStore: RankStore = {};

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadRankStore(): RankStore {
  if (!hasStorage()) {
    return memoryStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as RankStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveRankStore(store: RankStore) {
  memoryStore = store;

  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore persistence errors and keep the in-memory copy.
  }
}

export function clearRankStore() {
  memoryStore = {};

  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function recordSelection(path: string, now = Date.now()) {
  const current = loadRankStore();
  const entry = current[path] ?? { launches: 0, lastSelectedAt: 0 };

  saveRankStore({
    ...current,
    [path]: {
      launches: entry.launches + 1,
      lastSelectedAt: now
    }
  });
}

export function adaptiveRankBoost(path: string, now = Date.now(), store = loadRankStore()) {
  const entry = store[path];

  if (!entry) {
    return 0;
  }

  const ageHours = Math.max((now - entry.lastSelectedAt) / 3_600_000, 0);
  const recencyBoost = Math.max(32 - ageHours * 2, 0);
  const frequencyBoost = Math.min(entry.launches * 7, 42);
  return recencyBoost + frequencyBoost;
}
