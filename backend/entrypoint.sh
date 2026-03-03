#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h db -p 5432 -U friday; do
  echo "  PostgreSQL not ready, retrying in 2s..."
  sleep 2
done
echo "PostgreSQL is ready."

echo "Waiting for Redis..."
until redis-cli -h redis ping 2>/dev/null | grep -q PONG; do
  echo "  Redis not ready, retrying in 2s..."
  sleep 2
done
echo "Redis is ready."

echo "Running database migrations..."
alembic upgrade head

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
