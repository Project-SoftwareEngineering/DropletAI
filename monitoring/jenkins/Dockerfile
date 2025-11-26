# Custom Jenkins Docker Image with Go, Python, and Node.js
# This image is built to support Droplet platform CI/CD pipelines
# which require Go 1.21, Python 3.11, and Node.js 18

FROM jenkins/jenkins:lts

USER root

# Install basic dependencies
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    wget \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Go 1.21.13
RUN wget https://go.dev/dl/go1.21.13.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.13.linux-amd64.tar.gz && \
    rm go1.21.13.linux-amd64.tar.gz

# Set Go environment variables
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# Install Python 3.11 (Debian Trixie already has Python 3.11+)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-dev \
    python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Verify Python version and create symlinks if needed
RUN python3 --version

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Docker CLI (for Docker-in-Docker support)
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Install Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# Create docker group and add jenkins user to it
RUN groupadd -f docker && usermod -aG docker jenkins

# Install common Python packages for testing (using --break-system-packages for Docker container)
RUN pip3 install --no-cache-dir --break-system-packages \
    pytest \
    pytest-cov \
    pyyaml \
    requests

# Verify installations
RUN go version && \
    python3 --version && \
    node --version && \
    npm --version && \
    docker --version && \
    docker-compose --version

# Copy Jenkins plugins list
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

# Install Jenkins plugins
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Switch back to jenkins user
USER jenkins

# Expose Jenkins port
EXPOSE 8080 50000

# Set Jenkins home
ENV JENKINS_HOME=/var/jenkins_home

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/login || exit 1
