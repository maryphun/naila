PRAGMA foreign_keys = ON;

CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, emailVerified INTEGER NOT NULL DEFAULT 0, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
CREATE TABLE session (id TEXT PRIMARY KEY, expiresAt INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, ipAddress TEXT, userAgent TEXT, userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE);
CREATE INDEX session_user ON session(userId);
CREATE TABLE account (id TEXT PRIMARY KEY, accountId TEXT NOT NULL, providerId TEXT NOT NULL, userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, accessToken TEXT, refreshToken TEXT, idToken TEXT, accessTokenExpiresAt INTEGER, refreshTokenExpiresAt INTEGER, scope TEXT, password TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
CREATE INDEX account_user ON account(userId);
CREATE TABLE verification (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expiresAt INTEGER NOT NULL, createdAt INTEGER, updatedAt INTEGER);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings VALUES ('allowance', '20'), ('billing_enabled', 'false');

CREATE TABLE merchants (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES user(id),
  name TEXT NOT NULL, area TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('home','studio','mobile')),
  bio TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL DEFAULT 3.1073, lng REAL NOT NULL DEFAULT 101.6067,
  styles TEXT NOT NULL DEFAULT '[]', hours TEXT NOT NULL DEFAULT '{"open":"10:00","close":"19:00","days":[1,2,3,4,5,6]}',
  policy TEXT NOT NULL DEFAULT 'Please cancel at least 24 hours before your appointment.',
  auto_approve INTEGER NOT NULL DEFAULT 0, approved INTEGER NOT NULL DEFAULT 0,
  subscribed INTEGER NOT NULL DEFAULT 0, stripe_customer TEXT, stripe_subscription TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE services (
  id TEXT PRIMARY KEY, merchant_id TEXT NOT NULL REFERENCES merchants(id),
  name TEXT NOT NULL, name_zh TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK(price >= 0), duration INTEGER NOT NULL CHECK(duration BETWEEN 15 AND 480),
  buffer INTEGER NOT NULL DEFAULT 15 CHECK(buffer BETWEEN 0 AND 120),
  image TEXT NOT NULL, style TEXT NOT NULL, shape TEXT NOT NULL DEFAULT 'Any',
  active INTEGER NOT NULL DEFAULT 1, promoted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX service_merchant ON services(merchant_id, active);
CREATE TABLE bookings (
  id TEXT PRIMARY KEY, merchant_id TEXT NOT NULL REFERENCES merchants(id), user_id TEXT NOT NULL REFERENCES user(id),
  service_id TEXT NOT NULL REFERENCES services(id), date TEXT NOT NULL, start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL, name TEXT NOT NULL, price INTEGER NOT NULL, duration INTEGER NOT NULL, image TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','completed','cancelled','declined','expired')),
  locked INTEGER NOT NULL DEFAULT 0, request_key TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, request_key), CHECK(end_minute > start_minute)
);
CREATE INDEX booking_merchant_date ON bookings(merchant_id, date, status);
CREATE INDEX booking_user_date ON bookings(user_id, date);
CREATE TABLE acquisitions (
  merchant_id TEXT NOT NULL REFERENCES merchants(id), user_id TEXT NOT NULL REFERENCES user(id),
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id), credited INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(merchant_id, user_id)
);
CREATE TABLE blocks (id TEXT PRIMARY KEY, merchant_id TEXT NOT NULL REFERENCES merchants(id), date TEXT NOT NULL, start_minute INTEGER NOT NULL, end_minute INTEGER NOT NULL, CHECK(end_minute > start_minute));
CREATE INDEX block_date ON blocks(merchant_id,date);
CREATE TABLE messages (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES bookings(id), sender_id TEXT NOT NULL REFERENCES user(id), body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX message_booking ON messages(booking_id, created_at);
CREATE TABLE reviews (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id), rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id), booking_id TEXT REFERENCES bookings(id), title TEXT NOT NULL, body TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE events (id TEXT PRIMARY KEY, merchant_id TEXT NOT NULL REFERENCES merchants(id), kind TEXT NOT NULL CHECK(kind IN ('impression','view','call','whatsapp')), visitor TEXT NOT NULL, day TEXT NOT NULL, UNIQUE(merchant_id,kind,visitor,day));
CREATE TABLE outbox (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id), subject TEXT NOT NULL, body TEXT NOT NULL, sent INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE audit_log (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE webhook_events (id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')));

-- All gate and credit decisions execute inside the same D1 write transaction.
-- Keep each trigger on one LF-terminated physical line and parenthesize CASE expressions: D1's remote migration splitter can otherwise stop at the inner CASE END.
CREATE TRIGGER booking_gate AFTER INSERT ON bookings BEGIN UPDATE bookings SET locked = (CASE WHEN (SELECT subscribed FROM merchants WHERE id = NEW.merchant_id) = 1 THEN 0 WHEN (SELECT value FROM settings WHERE key = 'billing_enabled') != 'true' THEN 0 WHEN (SELECT COUNT(*) - COALESCE(SUM(credited),0) FROM acquisitions WHERE merchant_id = NEW.merchant_id) >= CAST((SELECT value FROM settings WHERE key='allowance') AS INTEGER) THEN 1 ELSE 0 END) WHERE id = NEW.id; INSERT INTO acquisitions(merchant_id,user_id,booking_id) VALUES(NEW.merchant_id,NEW.user_id,NEW.id) ON CONFLICT(merchant_id,user_id) DO NOTHING; UPDATE bookings SET status='approved' WHERE id=NEW.id AND locked=0 AND (SELECT auto_approve FROM merchants WHERE id=NEW.merchant_id)=1; END;

CREATE TRIGGER no_overlapping_approval BEFORE UPDATE OF status ON bookings WHEN NEW.status='approved' AND OLD.status!='approved' BEGIN SELECT (CASE WHEN EXISTS(SELECT 1 FROM bookings WHERE merchant_id=NEW.merchant_id AND date=NEW.date AND id!=NEW.id AND status IN ('approved','completed') AND start_minute < NEW.end_minute AND end_minute > NEW.start_minute) THEN RAISE(ABORT,'SLOT_TAKEN') END); SELECT (CASE WHEN EXISTS(SELECT 1 FROM blocks WHERE merchant_id=NEW.merchant_id AND date=NEW.date AND start_minute < NEW.end_minute AND end_minute > NEW.start_minute) THEN RAISE(ABORT,'SLOT_BLOCKED') END); END;
CREATE TRIGGER no_blocking_appointments BEFORE INSERT ON blocks BEGIN SELECT (CASE WHEN EXISTS(SELECT 1 FROM bookings WHERE merchant_id=NEW.merchant_id AND date=NEW.date AND status='approved' AND start_minute < NEW.end_minute AND end_minute > NEW.start_minute) THEN RAISE(ABORT,'APPOINTMENT_EXISTS') END); END;
CREATE TRIGGER cancellation_credit AFTER UPDATE OF status ON bookings WHEN NEW.status IN ('cancelled','declined') AND OLD.status NOT IN ('cancelled','declined') BEGIN UPDATE acquisitions SET credited=1 WHERE booking_id=NEW.id AND credited=0; END;
CREATE TRIGGER completed_reviews BEFORE INSERT ON reviews BEGIN SELECT (CASE WHEN (SELECT status FROM bookings WHERE id=NEW.booking_id)!='completed' THEN RAISE(ABORT,'NOT_COMPLETED') END); END;
