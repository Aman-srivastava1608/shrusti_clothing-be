# Multi-Branch Backend (Node.js + Express + MySQL)

## Setup
1. Create `.env` from `.env.example` and fill DB + JWT values.
2. Import `schema.sql` then `seed.sql` into MySQL.
3. Install deps: `npm install`
4. Run: `npm run dev`

## Auth
- **Admin Login:** `POST /api/auth/admin/login` → returns JWT (role:`super_admin`)
- **Branch Login:** `POST /api/auth/branch/login` → returns JWT (includes `branch_id`)

## Branches (super_admin only)
- **Create:** `POST /api/branches/create`
  ```json
  {
    "branch_name": "Branch 1",
    "address": "Main Road",
    "gst_number": "GST123",
    "mobile_number": "9876543210",
    "alternate_number": "9123456780",
    "admin_username": "branch1admin",
    "admin_password": "123456"
  }
  ```

## Products (branch scoped)
- **Add:** `POST /api/products/add`
- **List:** `GET /api/products/`

Always pass `Authorization: Bearer <token>`.
