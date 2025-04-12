FROM bitnami/spark:latest

# Install Python dependencies
USER root
RUN pip3 install --upgrade pip && \
    pip3 install pyspark pandas sqlalchemy psycopg2-binary jupyterlab

# Switch to non-root user for security
USER 1001

# Set environment variables for Spark
ENV SPARK_HOME=/opt/bitnami/spark
ENV PATH=$SPARK_HOME/bin:$PATH

# Copy entrypoint scriptCOPY --chmod=755 entrypoint.sh /entrypoint.sh
COPY --chmod=755 entrypoint.sh /entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]
