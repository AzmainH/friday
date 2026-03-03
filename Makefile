.PHONY: up down rebuild reset logs migrate makemigration check-migrations seed test-backend test-frontend generate-api shell db backup

up:
	docker compose up -d

down:
	docker compose down

rebuild:
	docker compose up -d --build

reset:
	docker compose down -v
	docker compose up -d --build

logs:
	docker compose logs -f backend worker

migrate:
	docker compose exec backend alembic upgrade head

makemigration:
	@read -p "Migration message: " msg; \
	docker compose exec backend alembic revision --autogenerate -m "$$msg"

check-migrations:
	docker compose exec backend alembic check

seed:
	docker compose exec backend python -m app.seed

test-backend:
	docker compose exec backend pytest -v --tb=short

test-frontend:
	docker compose exec frontend npm test

generate-api:
	docker compose exec frontend npx orval

shell:
	docker compose exec backend bash

db:
	docker compose exec db psql -U friday -d friday

backup:
	@mkdir -p backups
	docker compose exec db pg_dump -U friday friday > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/"
