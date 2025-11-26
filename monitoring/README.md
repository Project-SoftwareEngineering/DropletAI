# Droplet Monitoring & CI/CD

Prometheus + Grafana monitoring stack + Jenkins CI/CD for Droplet platform.

## Quick Start

```bash
cd monitoring
./install.sh
```

## Access

- **Grafana**: http://localhost:3001 (admin / droplet_admin_2024)
- **Prometheus**: http://localhost:9090
- **Jenkins**: http://localhost:8081

## Stop Services

```bash
docker-compose down
```

## Metrics Endpoint

Backend exposes metrics at: http://localhost:8080/metrics

## Jenkins Pipelines

- Backend Pipeline: `jenkins/pipelines/backend-pipeline.groovy`
- Frontend Pipeline: `jenkins/pipelines/frontend-pipeline.groovy`
- ML Pipeline: `jenkins/pipelines/ml-pipeline.groovy`
