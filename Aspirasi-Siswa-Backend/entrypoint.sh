#!/bin/sh
set -e

if [ ! -f /app/.env ]; then
    echo ".env not found, copying from .env.example"
    cp /app/.env.example /app/.env
fi

if [ ! -f /app/.initialized ]; then
    echo "First run setup..."
    ./migrate_app seed-admin

    touch /app/.initialized
fi

exec "$@"