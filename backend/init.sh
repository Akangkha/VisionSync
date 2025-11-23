#!/bin/bash
# Wait a bit for RabbitMQ to boot
sleep 5

# Add or ensure the user exists
rabbitmqctl add_user esperance esperance 2>/dev/null || true
rabbitmqctl set_user_tags esperance administrator
rabbitmqctl set_permissions -p / esperance ".*" ".*" ".*"
rabbitmqctl add_vhost myvhost 2>/dev/null || true
rabbitmqctl set_permissions -p myvhost esperance ".*" ".*" ".*"

echo "✅ RabbitMQ user 'esperance' fully configured with all access."
