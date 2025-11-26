#!/bin/bash

echo "🚀 Starting Droplet Monitoring Stack..."

docker-compose up -d

echo "✅ Monitoring stack started!"
echo ""
echo "📊 Access Points:"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana:    http://localhost:3001"
echo "  Username:   admin"
echo "  Password:   droplet_admin_2024"
