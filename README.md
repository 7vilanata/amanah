# Amanah Project Hub

Sistem project management internal untuk agency dengan `Next.js`, `MySQL`, `Prisma`, dan `NextAuth`.

## Fitur MVP

- Login email/password dengan role `OWNER`, `ADMIN`, `MEMBER`
- Dashboard KPI project dan task
- CRUD project dengan archive
- CRUD task dengan priority, status, timeline, dan single assignee
- Detail project dengan tab `Overview`, `Tasks`, `Board`, `Calendar`, `Members`
- Team management untuk owner/admin

## Stack

- `Next.js 16` App Router
- `Prisma 7` + `@prisma/adapter-mariadb`
- `MySQL` / `MariaDB`
- `NextAuth` credentials
- `Tailwind CSS`
- `Vitest` dan `Playwright`

## Setup

1. Salin env dan sesuaikan koneksi database:

```bash
cp .env.example .env
```

2. Jalankan schema ke database:

```bash
npm run db:push
```

3. Isi data awal:

```bash
npm run db:seed
```

4. Jalankan aplikasi:

```bash
npm run dev
```

## Seed Default

- `owner@amanah.local` / `Password123!`
- `admin@amanah.local` / `Password123!`
- `member@amanah.local` / `Password123!`

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run db:push`
- `npm run db:seed`

## Testing

- Unit test: validator, filter, dan permission helper
- E2E test: login, create project/task, board/calendar flow, dan akses member
- Untuk menjalankan E2E penuh, set `E2E_DATABASE_READY=1`, pastikan MySQL aktif, lalu seed database
