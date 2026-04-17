# CI/CD Pipeline: Jenkins + Docker + Kubernetes

## Project Overview

**Problem:** Development teams manually build, test, and deploy applications — leading to human errors, delayed releases, and inconsistent environments across dev/staging/prod.

**Solution:** End-to-end automated CI/CD pipeline using Jenkins that runs unit tests, security scans, builds Docker images, and deploys to Kubernetes with zero-downtime rolling updates. Release errors reduced by **60%**.

---

## Pipeline Flow

```
GitHub Push
    ↓
Jenkins Webhook
    ↓
Checkout → Install → Lint → Unit Tests → SonarQube
    ↓
Docker Build → Trivy Security Scan → Push to DockerHub
    ↓
Deploy to Staging → Smoke Test
    ↓ (Manual Approval)
Deploy to Production → Slack Notification
```

---

## Tech Stack

| Stage            | Tool                          |
|-----------------|-------------------------------|
| CI Server        | Jenkins (Declarative Pipeline)|
| Version Control  | GitHub + Webhooks             |
| Containerization | Docker (Multi-stage build)    |
| Security Scan    | Trivy (image vulnerability)   |
| Code Quality     | SonarQube                     |
| Orchestration    | Kubernetes (EKS/GKE)         |
| Notifications    | Slack                         |

---

## Folder Structure

```
project2-cicd-jenkins-pipeline/
├── Jenkinsfile                  # Declarative pipeline
├── app/
│   ├── src/
│   │   └── server.js            # Node.js Express app
│   └── package.json
├── docker/
│   └── Dockerfile               # Multi-stage build
├── kubernetes/
│   ├── deployment.yaml          # K8s deployment with probes
│   ├── service.yaml             # LoadBalancer service
│   └── hpa.yaml                 # Auto scaling policy
└── README.md
```

---

## Setup Instructions

### 1. Jenkins Prerequisites
Install these Jenkins plugins:
- Pipeline, Git, Docker Pipeline
- Kubernetes CLI, SonarQube Scanner
- Slack Notification, Blue Ocean

### 2. Configure Jenkins Credentials
Go to `Manage Jenkins → Credentials`:

| ID                     | Type              | Description             |
|------------------------|-------------------|-------------------------|
| `dockerhub-credentials`| Username/Password | DockerHub login         |
| `kubeconfig-staging`   | Secret file       | Staging kubeconfig      |
| `kubeconfig-prod`      | Secret file       | Production kubeconfig   |
| `sonarqube-token`      | Secret text       | SonarQube API token     |

### 3. Create Pipeline Job
```
New Item → Pipeline → Pipeline from SCM
SCM: Git → your repo URL
Script Path: Jenkinsfile
Build Trigger: GitHub hook trigger for GITScm polling
```

### 4. Test Locally with Docker
```bash
# Build image
docker build -f docker/Dockerfile -t nodeapp:local .

# Run container
docker run -p 8080:8080 nodeapp:local

# Test
curl http://localhost:8080/health
```

### 5. Deploy to Kubernetes Manually
```bash
kubectl create namespace production
kubectl apply -f kubernetes/
kubectl get pods -n production
kubectl get svc  -n production
```

---

## Key DevOps Concepts Demonstrated

- **Declarative Pipeline** — Stages, gates, post actions
- **Multi-stage Docker Build** — Smaller, secure images
- **Security-first** — Trivy scan blocks HIGH/CRITICAL CVEs
- **Zero-downtime Deployment** — Rolling update strategy
- **Auto Scaling** — HPA scales pods on CPU/memory
- **Non-root Container** — Runs as UID 1001, read-only FS
- **Manual Approval Gate** — Human confirmation before prod

---

## Author
**Sumit Jena** | DevOps Engineer  
[LinkedIn](https://www.linkedin.com/in/sumit-r-jena-898b341b0) | [GitHub](https://github.com/SumitJena1998)
