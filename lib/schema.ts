import { db } from './db'

export async function createTables() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      destination TEXT,
      start_date TEXT,
      end_date TEXT,
      currency TEXT DEFAULT 'USD',
      budget REAL DEFAULT 0,
      status TEXT DEFAULT 'planificado',
      color_idx INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS itinerary (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      day INTEGER NOT NULL,
      name TEXT NOT NULL,
      time TEXT,
      time_real TEXT,
      type TEXT DEFAULT 'actividades',
      status TEXT DEFAULT 'pendiente',
      note TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'otros',
      estimated REAL,
      real REAL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      visited INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 0,
      note TEXT,
      lat REAL,
      lng REAL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'otro',
      url TEXT,
      status TEXT DEFAULT 'activo',
      notes TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      my_vote TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journal (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      day INTEGER,
      date TEXT,
      title TEXT NOT NULL,
      text TEXT,
      rating INTEGER DEFAULT 0,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS checklist (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );
  `)
}