# Browser verification

The critical public flow and management login are exercised in a real browser during development at 320px, 768px, 1024px, and 1440px. Full live-backend E2E requires a seeded local Supabase project and a staff account; backend concurrency and authorization coverage remains in `supabase/tests/database` and `tests/integration`.
