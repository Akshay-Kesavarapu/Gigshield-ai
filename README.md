# GigShield AI  
### Smarter Insurance for Zomato Delivery Partners

GigShield AI is an AI-powered parametric insurance platform designed to support Zomato delivery partners when their income is affected by environmental conditions like heavy rain, extreme heat, or high pollution.

Delivery partners depend on completing orders to earn daily income. However, during adverse conditions, their earnings can drop by **20–30% per week**. GigShield AI solves this by providing **automatic compensation without manual claims**.

---

## 🚨 The Problem

India’s gig economy is growing rapidly, with millions of delivery partners working for platforms like Zomato, Swiggy, Zepto, and Amazon.

These workers face income instability due to factors beyond their control:

- Heavy rainfall  
- Extreme heat waves  
- Severe air pollution  
- Curfews or local restrictions  

When these occur, deliveries decrease, leading to **direct income loss**.

Currently, there is **no insurance product specifically designed** to protect gig workers from such disruptions.

---

## 🎯 Target Users

GigShield AI is built for:

- Zomato delivery partners  
- Outdoor gig workers  
- Workers paid per delivery  

**Typical Profile:**
- Daily earnings: ₹700 – ₹1200  
- Weekly payment cycle  
- High dependency on weather conditions  

---

## 👤 Real-Life Scenario

Rahul, a delivery partner in Chennai:

- Normal day: ~20 deliveries → ₹900  
- Bad weather: ~8–10 deliveries → significant income loss  

With GigShield AI:

1. Rahul subscribes to a weekly plan  
2. The system monitors environmental conditions  
3. If thresholds are exceeded:
   - Disruption is detected  
   - Location is verified  
   - Claim is generated automatically  
   - Compensation is credited instantly  

No paperwork. No delays.

---

## ⚙️ How It Works
## 🔄 Workflow

```
Worker Registration
    ↓
Select Weekly Plan
    ↓
AI Risk Assessment
    ↓
Policy Activation
    ↓
Real-Time Monitoring
    ↓
Trigger Detection
    ↓
Automatic Claim Generation
    ↓
Fraud Validation
    ↓
Instant Payout
```
---


## 💰 Pricing Model

Weekly subscription aligned with worker earnings:

| Plan     | Price | Coverage                     |
|----------|------|------------------------------|
| Basic    | ₹25  | Rain                         |
| Standard | ₹40  | Rain + Heat                  |
| Pro      | ₹60  | Rain + Heat + Pollution      |

### Pricing Logic

Premium = Base Price + Risk Factor

Factors considered:
- Weather history  
- Seasonal trends  
- Pollution levels  
- City-specific risks  

---

## 🌦 Parametric Triggers

Automatic payouts are triggered when:

| Condition         | Threshold         |
|------------------|------------------|
| Heavy Rain       | > 50 mm rainfall |
| Extreme Heat     | > 42°C           |
| Severe Pollution | AQI > 300        |

---

## 📱 Platform Choice

Mobile-first web application because:

- Delivery partners primarily use smartphones  
- Easy GPS tracking  
- Faster onboarding  
- Real-time alerts and updates  

---

## 🤖 Role of AI

### 1. Risk Prediction
Uses:
- Weather forecasts  
- Historical data  
- Pollution trends  
- Seasonal patterns  

Output: Risk score → determines pricing

---

### 2. Fraud Detection

Prevents misuse by checking:

- GPS location  
- Validity of environmental triggers  
- Duplicate claims  
- Delivery activity  

---

## 🔗 API Integrations

- Weather API → Rainfall & temperature  
- AQI API → Pollution levels  
- Google Maps API → Location tracking  
- Payment Gateway → Payout simulation  
- Mock Activity API → Delivery validation  

---

## 🏗 System Architecture
```
Mobile/Web App
↓
Backend Server
↓
AI Engine
├─ Risk Prediction
└─ Fraud Detection
↓
Insurance Engine
↓
External APIs
├─ Weather
├─ AQI
└─ Maps
↓
Payment Gateway
↓
Worker Wallet
```

---

## 📊 Dashboards

### Worker Dashboard
- Active coverage  
- Protected earnings  
- Claim history  
- Weekly payouts  

### Admin Dashboard
- Total users  
- Disruptions detected  
- Claims processed  
- Fraud attempts  
- Payout analytics  

---

## 🛠 Tech Stack

**Frontend:** React / Next.js  
**Backend:** Node.js / Flask  
**Database:** PostgreSQL / MongoDB  
**AI/ML:** Python, Scikit-learn, TensorFlow  
**APIs:** Weather, AQI, Maps  
**Payments:** Razorpay (Test Mode) / Stripe  
**Deployment:** Docker, AWS / Render  

---

## 🚀 Development Plan

### Phase 1 – Foundation
- Define problem & users  
- Design insurance model  
- Architecture planning  

### Phase 2 – Core Features
- User registration  
- Policy management  
- Premium calculation  
- Claims system  

### Phase 3 – Advanced Features
- Fraud detection  
- Instant payouts  
- Dashboards  
- Predictive analytics  

---

## 🌍 Expected Impact

GigShield AI will:

- Provide financial stability for gig workers  
- Automate insurance payouts  
- Reduce fraud using AI  
- Offer affordable protection  

Helping workers maintain **stable income despite environmental disruptions**.

---

## 📌 Project Context

This repository contains the **design and architecture** of GigShield AI for:

**Guidewire DEVTrails 2026 Hackathon – Phase 1**

### Future Work:
- Working prototype  
- AI model implementation  
- Real-time monitoring system  
- Automated payouts  
- Advanced analytics dashboard  
