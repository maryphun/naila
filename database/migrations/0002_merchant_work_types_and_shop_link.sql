ALTER TABLE merchants ADD COLUMN work_types TEXT NOT NULL DEFAULT '[]';
UPDATE merchants SET work_types = json_array(type);
ALTER TABLE merchants ADD COLUMN shop_link TEXT NOT NULL DEFAULT '';
