#!/bin/sh

# Wait for DB or Redis if necessary here

echo "Applying database migrations..."
python manage.py migrate --noinput

exec "$@"
