-- Mirrors the non-superuser, NOBYPASSRLS CI role contract from .github/workflows/pipeline.yml.
CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD 'app_pw';
  END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM app_role;
GRANT USAGE ON SCHEMA public TO app_role;
