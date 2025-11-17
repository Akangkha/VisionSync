# Use the official RabbitMQ image with management plugin
FROM rabbitmq:3-management

# Set default user and password
ENV RABBITMQ_DEFAULT_USER=esperance
ENV RABBITMQ_DEFAULT_PASS=esperance

# Expose AMQP and Management ports
EXPOSE 5672 15672

# Copy entrypoint script that ensures the user has full permissions
COPY init.sh /init.sh
RUN chmod +x /init.sh

# Run default entrypoint, then apply custom config
CMD ["bash", "-c", "/init.sh && rabbitmq-server"]
