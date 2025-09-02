-- seed.sql
-- Seed data for multi_branch_db

-- 1) Switch to DB
USE multi_branch_db;

-- 2) Create/Update Super Admin
-- Username (email): admin@gmail.com
-- Password (plain): Admin123
-- Password (bcrypt, cost=10): $2b$10$cw58TJbLhaNvJ1ccewLUt.0y1OkVy82SLyL5ruEVkqVa5CRpg7vCW

-- If `admins.username` is UNIQUE, this will upsert the row.
INSERT INTO admins (username, password)
VALUES ('admin@gmail.com', '$2b$10$cw58TJbLhaNvJ1ccewLUt.0y1OkVy82SLyL5ruEVkqVa5CRpg7vCW')
ON DUPLICATE KEY UPDATE password = VALUES(password);

-

