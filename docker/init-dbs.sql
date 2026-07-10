DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin WITH LOGIN PASSWORD 'admin123';
    ELSE
        ALTER ROLE admin WITH LOGIN PASSWORD 'admin123';
    END IF;
END
$$;

SELECT 'CREATE DATABASE gestionbanco OWNER admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gestionbanco')
\gexec

SELECT 'CREATE DATABASE "KinalSports" OWNER admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'KinalSports')
\gexec

GRANT ALL PRIVILEGES ON DATABASE gestionbanco TO admin;
GRANT ALL PRIVILEGES ON DATABASE "KinalSports" TO admin;
