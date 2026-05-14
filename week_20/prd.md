This is an excellent project scope. The combination of real-time requirements and a robust deployment strategy makes this a standout portfolio piece. Below is a detailed Product Requirements Document (PRD) specifically tailored to the **Deployment & Infrastructure** phase of CampusPulse.

---

# PRD: CampusPulse Infrastructure & Full App Deployment

| **Document Status** | Final Draft |
| :--- | :--- |
| **Version** | 1.0.0 |
| **Product** | CampusPulse - Real-Time College Event & Alert System |
| **Focus Area** | Cloud Deployment, CI/CD, Security, Scalability |

---

## 1. Executive Summary & Objective
**Goal:** Transition CampusPulse from a local development environment to a production-grade, secure, and scalable cloud infrastructure capable of handling concurrent WebSocket connections for a multi-user campus environment.

**Key Outcomes:**
- **Zero-Downtime Deployments:** `git push` updates the live app without interrupting active WebSocket sessions.
- **HTTPS Enforcement:** All traffic (HTTP/WebSocket) encrypted via TLS.
- **WebSocket Scalability:** Support for **500+ concurrent real-time connections** across multiple server instances using Redis Pub/Sub.

---

## 2. Infrastructure Architecture (AWS vs. Heroku Decision)

Given the complexity of **WebSocket scaling** and **Redis**, the recommendation is a **Hybrid AWS Approach** over Heroku (which struggles with sticky sessions for WebSockets at scale without expensive add-ons).

| Component | Technology Choice | Justification |
| :--- | :--- | :--- |
| **Compute** | **AWS EC2** (t3.medium) x2 | Horizontal scaling for Node.js/Socket.io servers. Heroku Dynos sleep; EC2 is always-on. |
| **Database** | **AWS RDS (PostgreSQL)** | Managed backups, easy scaling for "Smart Subscriptions" and user data. |
| **Cache/Queue** | **AWS ElastiCache (Redis)** | Critical for **Redis Pub/Sub**. Allows Server A to broadcast a message to users connected to Server B. |
| **Load Balancer** | **AWS ALB** | Supports WebSocket upgrade headers (`Upgrade: websocket`) and **Sticky Sessions** (required for Socket.io handshake). |
| **SSL/TLS** | **AWS ACM / Route 53** | Automatic certificate renewal and HTTPS termination at the Load Balancer. |
| **CI/CD** | **GitHub Actions** | Integrated directly with repo; no need for third-party Jenkins server. |

> *Alternative for Simplicity (If MVP):* Use **Render.com (Web Service + Redis)** . Render handles WebSockets better than Heroku Standard Tier, but AWS EC2 is required for demonstrating true distributed system understanding.

---

## 3. Detailed Deployment Requirements

### 3.1. Environment Configuration & Secrets Management
**Requirement:** **No `.env` files in source control.**
**Implementation:**
- **AWS Parameter Store** or **GitHub Secrets** will inject variables at runtime.
- **Variables List:**
    - `DATABASE_URL` (RDS Connection String)
    - `REDIS_URL` (ElastiCache Connection String)
    - `JWT_SECRET`
    - `AWS_ACCESS_KEY_ID` (for SES Email fallback)
    - `CORS_ORIGIN` (Frontend URL)

### 3.2. CI/CD Pipeline Workflow (GitHub Actions)
**Trigger:** `push` to `main` branch.

| Stage | Action | Verification |
| :--- | :--- | :--- |
| **1. Setup** | Checkout code, Node 20.x, Cache npm | Build time < 3 mins |
| **2. Test** | Run `npm run test` (Unit + Integration) | All tests must pass; if fail -> **STOP DEPLOY** |
| **3. Security Scan** | Run `npm audit` & Snyk for vulnerabilities | Block critical vulns |
| **4. Build** | Compile React Frontend -> `dist/` | Build artifact created |
| **5. Deploy** | **Rolling Deployment:** SSH into EC2-1 -> Update -> Restart PM2 -> Health Check -> Move to EC2-2 | **Zero-Downtime**: Users connected to EC2-2 while EC2-1 restarts. |
| **6. Notification** | Send build status to Discord/Slack | Team awareness |

### 3.3. WebSocket Scaling Implementation (The "Flex" Component)
**Problem:** Socket.io keeps a map of users in **memory**. If Server A receives a "New Hackathon" event, users connected to Server B **will not receive it** unless we use a **Message Broker**.

**Solution: Redis Adapter (`socket.io-redis`)**
```javascript
// Backend Code Snippet (Conceptual)
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**AWS Infrastructure Setup for this:**
1.  **ALB (Application Load Balancer):** Enable **Sticky Sessions** (Application-based cookie `AWSALB`). *Why?* Socket.io upgrades HTTP to WebSocket; the second handshake request *must* go to the same server that handled the first request.
2.  **Security Group:**
    - Allow Inbound: Port 80/443 from Anywhere.
    - Allow Inbound: Port 6379 (Redis) only from EC2 Security Group.

### 3.4. HTTPS Enforcement & Security Headers
**Requirement:** All traffic *must* be encrypted.
**Implementation:**
- **Load Balancer Level:** ALB Listener on Port 80 performs **HTTP -> HTTPS Redirect**.
- **Application Level:** Helmet.js Middleware configured with strict CSP (Content Security Policy) to allow WebSocket connections only to the specific domain.

---

## 4. Multi-User Scalability Testing Plan

To validate this architecture, we must simulate the "Spike" of a **Priority Alert** being sent to 500 students.

| Metric | Target Value | Testing Tool |
| :--- | :--- | :--- |
| **Latency (Alert Send to User Popup)** | < 500ms | Artillery.io (WebSocket Plugin) |
| **Concurrent Connections** | 1,000 | Autocannon / K6 |
| **Redis Pub/Sub Throughput** | > 10,000 msg/sec | Redis Benchmark |
| **CPU Usage** | < 60% at peak | AWS CloudWatch |

---

## 5. Fallback & Monitoring

### 5.1. Multi-Channel Fallback Logic
**Scenario:** User's WebSocket disconnects during a **🔴 HIGH Priority Alert** (e.g., Exam Room Change).
**Requirement:**
1.  System detects socket disconnect.
2.  System checks `Alert.priority === 'HIGH'`.
3.  System **immediately** triggers **AWS SES (Email)** to ensure delivery.
4.  **Database Flag:** `alert_delivered_email: true` to prevent double sending.

### 5.2. Monitoring Dashboard
**Tool:** PM2 Plus (Free tier) or AWS CloudWatch Dashboard.
**Alerts:**
- WebSocket Error Rate > 5% → PagerDuty Alert.
- Redis Memory Usage > 80% → Scale Up Notification.

---

## 6. Deployment Runbook (Step-by-Step Checklist)

- [ ] **Pre-Flight:**
    - [ ] Provision RDS PostgreSQL Instance (Multi-AZ for production).
    - [ ] Provision ElastiCache Redis Cluster.
    - [ ] Create EC2 Launch Template (User Data script installs Node, PM2, Git).
    - [ ] Create Target Group with **Stickiness Enabled**.
- [ ] **Initial Deploy:**
    - [ ] SSH into EC2-1: `git clone` -> `npm install` -> `pm2 start ecosystem.config.js`.
    - [ ] Repeat for EC2-2.
    - [ ] Verify Redis Adapter log: `Redis adapter connected`.
- [ ] **DNS Cutover:**
    - [ ] Point Route 53 `api.campus-pulse.app` -> ALB DNS Name.
    - [ ] Validate SSL Certificate.
- [ ] **CI/CD Verification:**
    - [ ] Make a dummy commit to `main`.
    - [ ] Watch GitHub Actions run.
    - [ ] Observe PM2 restart with `0 seconds downtime` on the metrics dashboard.

---

## 7. Appendix: PM2 Ecosystem File (`ecosystem.config.js`)

This file ensures the app restarts on failure and scales across CPU cores.

```javascript
module.exports = {
  apps : [{
    name   : "campus-pulse-backend",
    script : "./server.js",
    instances: "max", // Uses all CPU cores on the EC2 instance
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    },
    // Zero-downtime reload logic for CI/CD
    wait_ready: true,
    listen_timeout: 5000,
    kill_timeout: 3000
  }]
}
```