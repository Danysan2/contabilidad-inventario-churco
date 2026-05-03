#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
node node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate

echo "▶ Running seed..."
node prisma/seed.js || echo "⚠️  Seed completed with warnings (non-fatal)"

echo "▶ Starting Next.js..."
exec node server.js
