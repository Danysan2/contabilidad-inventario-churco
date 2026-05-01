#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
node node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate

echo "▶ Starting Next.js..."
exec node server.js
