import type { Migration } from './migrator';

export const migrations: readonly Migration[] = [
  {
    version: 1,
    description: 'create profile table',
    up: `
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 2,
    description: 'create incidents, media_refs, trips tables',
    up: `
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        label TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT
      );
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
        status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'discarded')),
        summary TEXT,
        operator_id TEXT,
        location_lat REAL,
        location_lng REAL,
        location_label TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE TABLE IF NOT EXISTS media_refs (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('photo', 'audio', 'note')),
        file_uri TEXT,
        text_body TEXT,
        captured_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_media_incident ON media_refs(incident_id);
    `,
  },
  {
    version: 3,
    description: 'create complaints table',
    up: `
      CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
        template_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft','sent','acknowledged','resolved','escalated')),
        recipient TEXT,
        regulator TEXT,
        body_markdown TEXT,
        response_markdown TEXT,
        created_at TEXT NOT NULL,
        sent_at TEXT,
        acknowledged_at TEXT,
        resolved_at TEXT,
        escalated_at TEXT,
        reminder_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
      CREATE INDEX IF NOT EXISTS idx_complaints_incident ON complaints(incident_id);
    `,
  },
  {
    version: 4,
    description: 'merge complaint fields into incidents; add draft status + events_json',
    up: `
      CREATE TABLE IF NOT EXISTS incidents_v4 (
        id TEXT PRIMARY KEY,
        trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
        status TEXT NOT NULL CHECK (status IN ('draft','in_progress','completed','discarded')),
        summary TEXT,
        operator_id TEXT,
        location_lat REAL,
        location_lng REAL,
        location_label TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        title TEXT,
        scenario_id TEXT,
        narrative TEXT,
        accompanied INTEGER,
        staff_interactions TEXT,
        witnesses TEXT,
        waited_minutes INTEGER,
        template_id TEXT,
        draft_body TEXT,
        recipient TEXT,
        sent_at TEXT,
        resolved_at TEXT,
        reminder_id TEXT,
        events_json TEXT NOT NULL DEFAULT '[]'
      );
      INSERT INTO incidents_v4 (id, trip_id, status, summary, operator_id, location_lat, location_lng, location_label, started_at, completed_at)
        SELECT id, trip_id, status, summary, operator_id, location_lat, location_lng, location_label, started_at, completed_at FROM incidents;
      DROP TABLE incidents;
      ALTER TABLE incidents_v4 RENAME TO incidents;
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      DROP TABLE IF EXISTS complaints;
    `,
  },
];
