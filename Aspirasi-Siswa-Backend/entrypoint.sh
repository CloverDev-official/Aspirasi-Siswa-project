#!/bin/sh
set -e

if [ ! -f /app/.initialized ]; then
    echo "First run setup..."
    ./migrate_app seed-admin

    touch /app/.initialized
fi

exec "$@"