#!/bin/bash
echo "🛑 Stopping Docker containers..."
sudo docker-compose down

echo "🗑️  Removing Docker volume (to reset password)..."
sudo docker volume rm api-taskflow_postgres_data
sudo docker volume rm api-taskflow_postgres_data_v2 2>/dev/null

echo "🚀 Starting Docker containers..."
sudo docker-compose up -d

echo "⏳ Waiting for Database to be ready..."
sleep 5

echo "🌱 Seeding database..."
npm run db:reset

echo "✅ Done! Try logging in now."
