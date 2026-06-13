# PulseReach 🚀

An AI-Native Customer Engagement CRM that enables businesses to manage customers, build intelligent audience segments, create AI-powered marketing campaigns, and track communication performance through a unified platform.

## 🌐 Live Demo

https://pulse-reach-green.vercel.app

## ✨ Highlights

* AI-powered campaign creation using natural language
* Intelligent audience segmentation based on customer behavior
* Customer and order management
* Multi-channel campaign simulation
* Communication lifecycle tracking
* Campaign analytics and engagement insights
* Google OAuth authentication

---

## 📌 Overview

PulseReach combines customer data management, audience segmentation, campaign execution, and analytics into a single AI-native workflow.

Instead of manually creating audiences and marketing campaigns, users can simply describe their objective in natural language, allowing the AI assistant to help with audience targeting, campaign creation, and message generation.

---

## 🏗️ Architecture

```text
User
 │
 ▼
Next.js Application
 │
 ├── Customer Management
 ├── Segmentation Engine
 ├── AI Assistant
 ├── Campaign Engine
 │
 ▼
Prisma ORM
 │
 ▼
PostgreSQL

Campaign Engine
 │
 ▼
Channel Service (Simulation)
 │
 ▼
Analytics Dashboard
```

---

## ⚙️ Tech Stack

| Layer          | Technology                 |
| -------------- | -------------------------- |
| Frontend       | Next.js, React, TypeScript |
| UI             | Tailwind CSS, shadcn/ui    |
| Backend        | Next.js API Routes         |
| Database       | PostgreSQL                 |
| ORM            | Prisma                     |
| Authentication | NextAuth, Google OAuth     |
| AI             | OpenRouter                 |
| Deployment     | Vercel                     |

---

## 🚀 Key Features

### Customer Management

Manage customer profiles, purchase history, and engagement data.

### Audience Segmentation

Create dynamic customer segments using behavioral and demographic filters.

### AI Assistant

Generate campaigns and marketing messages using natural language.

### Campaign Management

Create, manage, and monitor marketing campaigns.

### Communication Tracking

Simulate message delivery events including sent, delivered, opened, clicked, and failed.

### Analytics Dashboard

Monitor campaign performance and customer engagement metrics.

---

## 🛠️ Local Setup

### Clone Repository

```bash
git clone https://github.com/AayushVerma16/PulseReach.git
cd PulseReach
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```env
DATABASE_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

OPENROUTER_API_KEY=
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Start Development Server

```bash
npm run dev
```

---

## 🔮 Future Improvements

* Real messaging provider integrations
* Queue-based campaign processing
* Advanced customer analytics
* Predictive audience recommendations
* AI-powered campaign optimization

---

## 👨‍💻 Author

**Aayush Verma**

GitHub: https://github.com/AayushVerma16
