/**
 * Local, sign-in-free data layer.
 * ---------------------------------------------------------------------
 * StudySync AI runs without accounts. Everything a signed-in user used to
 * store in the cloud is now kept in this browser, behind a tiny query
 * builder that mimics the small slice of the PostgREST client the app
 * actually uses (`select / insert / update / upsert / delete` plus
 * `eq / gte / not / order / limit / single / maybeSingle`).
 *
 * Keeping the same call shape means every feature module (stats, goals,
 * notes, companion, tutor) works unchanged — only the import changes.
 */

export const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";

const DB_KEY = "studysync:local-db:v1";
const FILES_KEY = "studysync:local-files:v1";
const MAX_FILE_BYTES = 3 * 1024 * 1024; // keep localStorage healthy

type Row = Record<string, any>;
type Tables = Record<string, Row[]>;

const nowISO = () => new Date().toISOString();
const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/* ------------------------------------------------------------------ */
/* Seeds + per-table defaults                                          */
/* ------------------------------------------------------------------ */

const CATALOG_SEED: Row[] = [
  {
    id: "3b69f90b-eafe-4ea7-8d69-6c90026cc7c8",
    slug: "sync",
    name: "Sync",
    species: "orb",
    rarity: "common",
    base_theme_id: "aurora",
    description: "Your calm everyday study companion.",
    is_starter: true,
    unlock_cost: 0,
    metadata: {},
  },
  {
    id: "91841300-593c-409d-b28b-33f30fb1dde7",
    slug: "lumi",
    name: "Lumi",
    species: "spirit",
    rarity: "rare",
    base_theme_id: "ember",
    description: "A warmer, encouraging presence for long days.",
    is_starter: false,
    unlock_cost: 150,
    metadata: {},
  },
  {
    id: "58890450-4195-4bd6-9942-8eb359fce9df",
    slug: "nova",
    name: "Nova",
    species: "creature",
    rarity: "epic",
    base_theme_id: "ocean",
    description: "A focused, high-energy companion for sprints.",
    is_starter: false,
    unlock_cost: 300,
    metadata: {},
  },
];

const ITEMS_SEED: Row[] = [
  { id: "6e23bddc-f362-472d-9b85-f2c3d9aaf4e9", slug: "theme-aurora", name: "Aurora", kind: "theme", rarity: "common", cost_coins: 0, description: "Soft violet aurora glow.", preview: { accent: "oklch(0.72 0.18 290)" }, unlock_rule: {} },
  { id: "a0ec20fb-5964-4ab1-bb27-336700bdc9e6", slug: "theme-ocean", name: "Ocean", kind: "theme", rarity: "rare", cost_coins: 80, description: "Cool deep-water gradient.", preview: { accent: "oklch(0.7 0.15 220)" }, unlock_rule: {} },
  { id: "12494b05-51e7-4043-9572-59ad9489f6f2", slug: "theme-ember", name: "Ember", kind: "theme", rarity: "rare", cost_coins: 80, description: "Warm late-night ember tone.", preview: { accent: "oklch(0.7 0.18 40)" }, unlock_rule: {} },
  { id: "d2a61bc6-0fff-4af9-872c-17ffd3f7b51e", slug: "halo-soft", name: "Soft Halo", kind: "accessory", rarity: "common", cost_coins: 50, description: "A gentle ring around your orb.", preview: { effect: "halo" }, unlock_rule: {} },
  { id: "03d8863d-3e0f-4456-91b5-380a54414708", slug: "crown-streak7", name: "Streak Crown", kind: "accessory", rarity: "epic", cost_coins: 0, description: "Earned at a 7-day streak.", preview: { effect: "crown" }, unlock_rule: { streak: 7 } },
];

const DEFAULTS: Record<string, Row> = {
  profiles: {
    id: LOCAL_USER_ID,
    email: null,
    full_name: "Explorer",
    avatar_url: null,
    onboarded: false,
    study_goals: null,
    subjects: null,
    exam_type: null,
    study_style: null,
  },
  user_stats: {
    user_id: LOCAL_USER_ID,
    coins: 0,
    streak: 0,
    cycle_count: 0,
    completed_today: 0,
    total_focus_sessions: 0,
    momentum_score: 0,
    long_breaks_today: 0,
    last_break_date: null,
    last_completed_date: null,
    companion_theme: "aurora",
    unlocked_themes: [],
    unlocked_features: [],
    current_task: null,
  },
  daily_goals: { done: false },
  study_sessions: { completed_at: null, duration_seconds: 0 },
  mood_logs: {},
  chat_messages: { mood: null },
  notes: { title: "Untitled", content: "", tags: [], pinned: false },
  pdfs: { tags: [], page_count: null, summary: null, processing_status: "pending" },
  flashcard_decks: { description: null, source: "manual", tags: [] },
  flashcards: { ease: 2.5, interval_days: 0, repetitions: 0, due_at: null, last_reviewed_at: null },
  quizzes: { description: null, source: "manual", tags: [] },
  saved_explanations: { title: "Saved explanation", source_question: null, folder: null, tags: [], favorite: false },
  learning_collections: { description: null, color: null },
  collection_items: { position: 0 },
  companions: {
    level: 1,
    experience: 0,
    experience_to_next: 100,
    mood: "calm",
    is_active: false,
    unlocked_via: "starter",
    last_interacted_at: null,
    metadata: {},
  },
  companion_inventory: { is_equipped: false, equipped_on: null, acquired_via: "coins" },
  companion_milestones: { threshold: null, reward: {}, companion_id: null },
  companion_reactions: { style: "supportive", intensity: 1, message: null, metadata: {}, companion_id: null },
  companion_concepts: {
    name: null,
    prompt: null,
    style: "soft",
    status: "draft",
    reference_path: null,
    inspiration_paths: [],
    generated_asset_path: null,
    preview_url: null,
    adopted_at: null,
    error: null,
    palette: {},
  },
};

const PRIMARY_KEY: Record<string, string> = { profiles: "id", user_stats: "user_id" };

function seedDb(): Tables {
  return {
    companion_catalog: CATALOG_SEED.map((r) => ({ ...r, created_at: nowISO(), updated_at: nowISO() })),
    companion_items: ITEMS_SEED.map((r) => ({ ...r, created_at: nowISO() })),
    profiles: [{ ...DEFAULTS.profiles, created_at: nowISO(), updated_at: nowISO() }],
    user_stats: [{ ...DEFAULTS.user_stats, created_at: nowISO(), updated_at: nowISO() }],
  };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

let cache: Tables | null = null;

function read(): Tables {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = seedDb());
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    const parsed = raw ? (JSON.parse(raw) as Tables) : null;
    cache = parsed ? { ...seedDb(), ...parsed } : seedDb();
  } catch {
    cache = seedDb();
  }
  // Keep read-only catalogs fresh even for returning visitors.
  cache.companion_catalog = seedDb().companion_catalog;
  cache.companion_items = seedDb().companion_items;
  return cache;
}

function write(db: Tables) {
  cache = db;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* quota — keep the in-memory copy */
  }
}

function rows(table: string): Row[] {
  const db = read();
  if (!db[table]) db[table] = [];
  return db[table];
}

function commit() {
  write(read());
}

/** Wipes every locally stored StudySync record. */
export function resetLocalData() {
  cache = null;
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DB_KEY);
  window.localStorage.removeItem(FILES_KEY);
}

/* ------------------------------------------------------------------ */
/* Query builder                                                       */
/* ------------------------------------------------------------------ */

type Filter = (row: Row) => boolean;

interface Result<T> {
  data: T;
  error: { message: string } | null;
}

class Query implements PromiseLike<Result<any>> {
  private filters: Filter[] = [];
  private sorts: { column: string; asc: boolean }[] = [];
  private limitN: number | null = null;
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] = {};
  private wantsRows = false;
  private singleMode: "one" | "maybe" | null = null;

  constructor(private table: string) {}

  select(_cols?: string) {
    if (this.mode === "select") this.mode = "select";
    this.wantsRows = true;
    return this;
  }
  insert(values: Row | Row[]) {
    this.mode = "insert";
    this.payload = values;
    return this;
  }
  update(values: Row) {
    this.mode = "update";
    this.payload = values;
    return this;
  }
  upsert(values: Row, _opts?: { onConflict?: string }) {
    this.mode = "upsert";
    this.payload = values;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push((r) => r[column] !== value);
    return this;
  }
  gte(column: string, value: string | number) {
    this.filters.push((r) => r[column] != null && r[column] >= value);
    return this;
  }
  lte(column: string, value: string | number) {
    this.filters.push((r) => r[column] != null && r[column] <= value);
    return this;
  }
  is(column: string, value: unknown) {
    this.filters.push((r) => (r[column] ?? null) === (value ?? null));
    return this;
  }
  /** Only `not(col, "is", null)` is used by the app. */
  not(column: string, _op: string, value: unknown) {
    this.filters.push((r) => (r[column] ?? null) !== (value ?? null));
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.push((r) => values.includes(r[column]));
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }) {
    this.sorts.push({ column, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.singleMode = "one";
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }

  private matches(): Row[] {
    return rows(this.table).filter((r) => this.filters.every((f) => f(r)));
  }

  private sorted(list: Row[]) {
    const out = [...list];
    for (const s of [...this.sorts].reverse()) {
      out.sort((a, b) => {
        const av = a[s.column];
        const bv = b[s.column];
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av > bv ? 1 : -1;
        return s.asc ? cmp : -cmp;
      });
    }
    return out;
  }

  private run(): Result<any> {
    const table = this.table;
    let affected: Row[] = [];

    if (this.mode === "insert" || this.mode === "upsert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      const pk = PRIMARY_KEY[table] ?? "id";
      for (const values of list) {
        const existing =
          this.mode === "upsert" && values[pk] != null
            ? rows(table).find((r) => r[pk] === values[pk])
            : undefined;
        if (existing) {
          Object.assign(existing, values, { updated_at: nowISO() });
          affected.push(existing);
        } else {
          const row: Row = {
            id: uuid(),
            ...DEFAULTS[table],
            ...values,
            created_at: nowISO(),
            updated_at: nowISO(),
          };
          if (table === "study_sessions" && !row.completed_at) row.completed_at = nowISO();
          if (table === "flashcards" && !row.due_at) row.due_at = nowISO();
          rows(table).push(row);
          affected.push(row);
        }
      }
      commit();
    } else if (this.mode === "update") {
      affected = this.matches();
      for (const row of affected) Object.assign(row, this.payload, { updated_at: nowISO() });
      commit();
    } else if (this.mode === "delete") {
      affected = this.matches();
      const keep = rows(table).filter((r) => !affected.includes(r));
      read()[table] = keep;
      commit();
    } else {
      affected = this.sorted(this.matches());
      if (this.limitN != null) affected = affected.slice(0, this.limitN);
    }

    if (this.singleMode === "one") {
      if (affected.length !== 1) {
        return affected.length === 0
          ? { data: null, error: { message: "No rows found" } }
          : { data: this.clone(affected[0]), error: null };
      }
      return { data: this.clone(affected[0]), error: null };
    }
    if (this.singleMode === "maybe") {
      return { data: affected.length ? this.clone(affected[0]) : null, error: null };
    }
    if (!this.wantsRows && this.mode !== "select") return { data: null, error: null };
    return { data: affected.map((r) => this.clone(r)), error: null };
  }

  private clone(row: Row) {
    return JSON.parse(JSON.stringify(row));
  }

  then<TResult1 = Result<any>, TResult2 = never>(
    onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    let result: Result<any>;
    try {
      result = this.run();
    } catch (e) {
      result = { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
    }
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

/* ------------------------------------------------------------------ */
/* Local file storage (replaces buckets)                               */
/* ------------------------------------------------------------------ */

function readFiles(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(FILES_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeFiles(files: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FILES_KEY, JSON.stringify(files));
  } catch {
    /* quota */
  }
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const storage = {
  from(_bucket: string) {
    return {
      async upload(path: string, body: Blob, _opts?: unknown) {
        if (body.size > MAX_FILE_BYTES) {
          // Too large for browser storage — keep the record, skip the bytes.
          return { data: { path }, error: null };
        }
        const files = readFiles();
        files[path] = await toDataUrl(body);
        writeFiles(files);
        return { data: { path }, error: null as null | { message: string } };
      },
      async remove(paths: string[]) {
        const files = readFiles();
        for (const p of paths) delete files[p];
        writeFiles(files);
        return { data: null, error: null };
      },
      async createSignedUrl(path: string, _ttl: number) {
        const url = readFiles()[path];
        return url
          ? { data: { signedUrl: url }, error: null }
          : { data: null, error: { message: "Not found" } };
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: readFiles()[path] ?? "" } };
      },
      async download(path: string) {
        const url = readFiles()[path];
        if (!url) return { data: null, error: { message: "Not found" } };
        const blob = await (await fetch(url)).blob();
        return { data: blob, error: null };
      },
    };
  },
};

/** Drop-in replacement for the cloud client, backed by this browser. */
export const localDb = {
  from(table: string) {
    return new Query(table) as any;
  },
  storage,
};
