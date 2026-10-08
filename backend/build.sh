#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "===> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "===> Collecting static files with WhiteNoise..."
python manage.py collectstatic --no-input

echo "===> Running database migrations..."
python manage.py migrate --no-input

echo "===> Seeding 300+ Pakistan cities & terminals..."
python seed_all_pakistan_cities.py

echo "===> Build completed successfully!"
