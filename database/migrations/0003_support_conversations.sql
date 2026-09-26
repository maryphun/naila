CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('booking','app_feedback','customer_service')),
  owner_id TEXT NOT NULL REFERENCES user(id),
  booking_id TEXT UNIQUE REFERENCES bookings(id),
  subject TEXT,
  category TEXT CHECK(category IS NULL OR category IN ('feature_request','ui_ux','bug','merchant_tools','booking_experience','other')),
  request_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK((type='booking' AND booking_id IS NOT NULL) OR (type!='booking' AND booking_id IS NULL))
);
CREATE UNIQUE INDEX conversation_customer_service_owner ON conversations(owner_id) WHERE type='customer_service';
CREATE UNIQUE INDEX conversation_request_key ON conversations(owner_id,request_key) WHERE request_key IS NOT NULL;
CREATE INDEX conversation_owner_updated ON conversations(owner_id,updated_at DESC);

INSERT INTO conversations(id,type,owner_id,booking_id,created_at,updated_at)
  SELECT id,'booking',user_id,id,created_at,created_at FROM bookings;

CREATE TABLE messages_next (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  sender_id TEXT NOT NULL REFERENCES user(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO messages_next(id,conversation_id,sender_id,body,created_at)
  SELECT id,booking_id,sender_id,body,created_at FROM messages ORDER BY rowid;
DROP TABLE messages;
ALTER TABLE messages_next RENAME TO messages;
CREATE INDEX message_conversation ON messages(conversation_id,created_at);

CREATE TABLE conversation_reads (
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  user_id TEXT NOT NULL REFERENCES user(id),
  last_read_rowid INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(conversation_id,user_id)
);

ALTER TABLE notifications ADD COLUMN conversation_id TEXT REFERENCES conversations(id);
ALTER TABLE outbox ADD COLUMN conversation_id TEXT REFERENCES conversations(id);

CREATE TRIGGER booking_conversation AFTER INSERT ON bookings BEGIN INSERT INTO conversations(id,type,owner_id,booking_id) VALUES(NEW.id,'booking',NEW.user_id,NEW.id); END;
CREATE TRIGGER conversation_message_touch AFTER INSERT ON messages BEGIN UPDATE conversations SET updated_at=datetime('now') WHERE id=NEW.conversation_id; END;
