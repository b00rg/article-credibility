# Use a lightweight Python 3.9 image
FROM python:3.9-slim

# Install Java 17 (for Spark) and required system utilities
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless procps g++ build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME environment variable for Java 17
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Set the working directory inside the container
WORKDIR /

# Copy only the requirements file first (to leverage Docker caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the rest of the application code
COPY . /backend

# Expose FastAPI's default port
EXPOSE 8000

# Start FastAPI using uvicorn (Integrated directly in Dockerfile)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
