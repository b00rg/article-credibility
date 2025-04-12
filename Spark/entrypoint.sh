#!/bin/bash
# Set environment variables
export SPARK_HOME=/opt/bitnami/spark
export SPARK_LOCAL_DIRS=/tmp

# Start Spark Master
$SPARK_HOME/sbin/start-master.sh --host 0.0.0.0 --port 7077

# Wait for Master to fully initialize
sleep 5

# Get Spark Master URL
MASTER_URL=""
for i in {1..5}; do
  MASTER_URL=$(grep -o 'spark://[^ ]*' $SPARK_HOME/logs/spark--org.apache.spark.deploy.master.Master-1-*.out | head -n 1)
  if [[ ! -z "$MASTER_URL" ]]; then
    break
  fi
  echo "Waiting for Spark Master URL..."
  sleep 2
done

# If MASTER_URL is empty, fallback to default
if [ -z "$MASTER_URL" ]; then
  echo "Warning: Could not determine Spark Master URL, using default."
  MASTER_URL="spark://spark_container:7077"
fi
echo "Using Spark Master URL: $MASTER_URL"

# Start Spark Worker
$SPARK_HOME/sbin/start-worker.sh $MASTER_URL || echo "Worker failed to start"

# Keep container running
tail -f /dev/null
