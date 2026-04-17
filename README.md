# GigShield AI
### AI-Powered Parametric Insurance for Zomato Delivery Partners

GigShield AI is an **AI-powered parametric insurance platform** designed to protect **Zomato delivery partners** from income loss caused by environmental disruptions such as **heavy rainfall, extreme heat, and severe air pollution**.

Delivery partners depend on completing deliveries to earn daily income. When environmental disruptions occur, they may lose **20–30% of their weekly earnings**. GigShield AI provides **automatic compensation using parametric insurance**, ensuring financial protection during such events.

---

# Problem Overview

India’s gig economy includes millions of delivery partners working for platforms like Zomato, Swiggy, Zepto, and Amazon.

These workers face **income instability due to uncontrollable external disruptions** such as:

- Heavy rainfall
- Extreme heat waves
- Severe air pollution
- Curfews or local restrictions

When these events occur, workers cannot complete deliveries, resulting in **direct loss of income**.

Currently, there is **no insurance product specifically designed to protect gig workers against income loss caused by such external disruptions**.

GigShield AI addresses this gap through **AI-enabled parametric insurance with automatic payouts**.

---

# Target Persona

| Attribute | Description |
|-----------|-------------|
| Worker Type | Zomato Delivery Partner |
| Work Environment | Outdoor urban delivery |
| Income Model | Paid per delivery |
| Avg Daily Earnings | ₹700 – ₹1200 |
| Payment Cycle | Weekly |
| Key Risk | Environmental disruptions reducing work hours |

---

# Persona-Based Scenario

Rahul is a **Zomato delivery partner working in Chennai**.

On a typical day, Rahul completes **20 deliveries** and earns approximately **₹900**.

However, during **heavy rain or extreme heat**, delivery demand drops and outdoor work becomes unsafe. Rahul may complete only **8–10 deliveries**, losing nearly half his daily income.

Using **GigShield AI**, Rahul subscribes to a **weekly insurance plan**.

If rainfall or extreme heat crosses predefined thresholds in Rahul’s delivery area, the system automatically:

1. Detects the disruption using environmental APIs
2. Confirms Rahul’s location
3. Generates a claim automatically
4. Sends compensation directly to Rahul’s wallet

This ensures Rahul receives **income protection without manual claims**.

---

## Application Workflow

```
Worker Registration
↓
Select Weekly Insurance Plan
↓
AI Risk Assessment
↓
Policy Activation
↓
Real-Time Disruption Monitoring
↓
Parametric Trigger Detection
↓
Automatic Claim Generation
↓
Fraud Detection Validation
↓
Instant Payout to Worker
```

This workflow ensures a **seamless zero-touch claim process**.

---

# Weekly Premium Model

GigShield AI follows a **weekly subscription-based insurance model**, matching the earnings cycle of gig workers.

| Plan | Weekly Premium | Coverage |
|------|---------------|----------|
| Basic | ₹25 | Rain protection |
| Standard | ₹40 | Rain + Heat |
| Pro | ₹60 | Rain + Heat + Pollution |

### Pricing Logic

The weekly premium is determined using **AI-based risk prediction**.

Factors used:

- Historical weather patterns
- Seasonal disruption probability
- Pollution trends
- City-specific environmental risks

Example logic:
Weekly Premium = Base Premium + Risk Factor

Workers operating in **higher-risk locations** may have slightly higher premiums.

---

# Parametric Triggers

Parametric insurance automatically triggers payouts when predefined environmental thresholds are met.

| Disruption | Trigger Condition | Impact |
|-----------|------------------|--------|
| Heavy Rain | Rainfall > 50 mm | Delivery slowdown |
| Extreme Heat | Temperature > 42°C | Unsafe working conditions |
| Severe Pollution | AQI > 300 | Reduced delivery activity |

These triggers are monitored through **real-time API integrations**.

---

# Platform Choice: Web vs Mobile

GigShield AI will be built as a **mobile-first web platform**.

Reasons:

- Delivery partners primarily use **smartphones**
- GPS-based location validation is easier
- Faster onboarding experience
- Real-time notifications for disruption alerts and payouts

A mobile-first approach ensures **maximum accessibility for gig workers**.

---

# AI / ML Integration

AI plays a critical role in multiple parts of the system.

## 1 Risk Prediction Model

Predicts the probability of disruptions in a worker’s delivery zone.

Inputs:

- Weather forecast data
- Historical rainfall records
- Pollution patterns
- Seasonal environmental data

Output:

- **Risk score used for dynamic weekly premium calculation**

---

## 2 Fraud Detection Model

The platform prevents fraudulent claims through AI-driven anomaly detection.

Fraud detection includes:

- GPS location verification
- Environmental trigger validation
- Duplicate claim detection
- Worker activity confirmation

Example:

If rainfall occurs in **Zone A** but the worker is located in **Zone B**, the system rejects the claim automatically.

---

# Integration with External APIs

| API | Purpose |
|----|--------|
| OpenWeather API | Detect rainfall and temperature |
| AQI API | Monitor pollution levels |
| Google Maps API | Verify worker location |
| Payment Gateway API | Simulate payouts |
| Platform Activity API (Mock) | Validate delivery activity |

---

## System Architecture

```
Mobile / Web Application
↓
Backend API Server
↓
AI Engine
   ├─ Risk Prediction Model
   └─ Fraud Detection Model
↓
Parametric Insurance Engine
↓
External Data APIs
   ├─ Weather API
   ├─ Air Quality API
   └─ Geolocation API
↓
Payment Gateway (Sandbox)
↓
Worker Wallet / Payout System
```
---

# Analytics Dashboard

The platform includes dashboards for both workers and insurers.

### Worker Dashboard

Shows:

- Active insurance coverage
- Protected earnings
- Claim history
- Weekly payout summary

### Admin Dashboard

Shows:

- Number of insured workers
- Disruption events detected
- Claims processed
- Fraud attempts detected
- Weekly payout analytics

---

# Technology Stack

### Frontend
React / Next.js

### Backend
Node.js or Python Flask

### Database
PostgreSQL / MongoDB

### AI / Machine Learning
Python  
Scikit-learn  
TensorFlow (optional)

### APIs
OpenWeather API  
AQI API  
Google Maps API

### Payments
Razorpay Sandbox / Stripe Test Mode

### Deployment
Docker  
AWS / Render

---

# Development Plan

### Phase 1 – Ideation & Foundation

- Define target persona
- Identify disruption triggers
- Design parametric insurance model
- Create architecture and documentation

### Phase 2 – Automation & Protection

- Worker registration system
- Insurance policy management
- Dynamic premium calculation
- Claims management system

### Phase 3 – Scale & Optimization

- Advanced fraud detection
- Instant payout simulation
- Worker and admin dashboards
- Predictive disruption analytics

---

# Expected Impact

GigShield AI will:

- Provide financial stability for gig workers
- Automate insurance payouts without paperwork
- Reduce fraudulent claims through AI
- Offer affordable weekly insurance plans

This solution helps gig workers maintain **stable earnings despite environmental disruptions**, strengthening India’s growing gig economy.

---

# Repository Purpose

This repository contains the **design, architecture, and development plan** for GigShield AI as part of the **Guidewire DEVTrails 2026 Hackathon – Phase 1 Submission**.

Future phases will include:

- Working prototype
- AI models
- Automated disruption detection
- Instant payout simulation
- Analytics dashboards
