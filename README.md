# PulseReach 🚀

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)
![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-purple)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)

An AI-Native Customer Engagement CRM that helps marketers identify the right audience, create personalized campaigns using AI, simulate communication delivery, and track campaign performance through a unified dashboard.

## 🌐 Live Demo

https://pulse-reach.vercel.app

---

## 🌟 Overview

PulseReach is an AI-native customer engagement platform designed to help businesses manage customer relationships and run intelligent marketing campaigns.

The platform combines customer management, audience segmentation, AI-powered campaign creation, communication tracking, and analytics into a single workflow. Marketers can interact with the system using natural language to create targeted campaigns and generate personalized content more efficiently.

---

## ✨ Features

### 👥 Customer Management

* Manage customer profiles and purchase history
* Import customer data through CSV uploads
* Store customer attributes and engagement data

### 🎯 Audience Segmentation

* Create dynamic customer segments
* Filter audiences based on customer behavior and attributes
* Preview matching customers before launching campaigns

### 🤖 AI-Powered Campaign Creation

* Create campaigns using natural language
* Generate personalized campaign messages
* AI-assisted audience targeting
* Automated campaign workflow generation

### 📢 Campaign Management

* Create and manage campaigns
* Associate campaigns with customer segments
* Track campaign execution and status

### 📨 Simulated Channel Service

* Models real-world communication workflows
* Simulates communication lifecycle events:

  * Sent
  * Delivered
  * Opened
  * Clicked
  * Failed

### 📊 Analytics Dashboard

* Campaign performance tracking
* Delivery and engagement analytics
* Communication lifecycle monitoring
* Customer engagement insights

---

## 🤖 Why AI-Native?

PulseReach is built around natural language interactions.

Instead of manually creating audience segments and campaigns, marketers can simply describe their objective, and the AI assists with:

* Audience Selection
* Campaign Creation
* Personalized Message Generation
* Marketing Workflow Automation

This creates a faster and more intuitive customer engagement experience.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────┐
                    │     Marketer    │
                    │   PulseReach    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Next.js App   │
                    │ Dashboard & UI  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   API Routes    │
                    │ (Backend Layer) │
                    └────────┬────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼

┌──────────────┐   ┌────────────────┐   ┌────────────────┐
│ Segmentation │   │   AI Engine    │   │ Campaign Engine│
│    Engine    │   │   OpenRouter   │   │ & Dispatcher   │
└──────┬───────┘   └────────────────┘   └──────┬─────────┘
       │                                        │
       ▼                                        ▼

┌─────────────────┐                 ┌─────────────────┐
│ PostgreSQL DB   │                 │ Channel Service │
│     Prisma      │                 │  (Simulation)   │
└─────────────────┘                 └────────┬────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Delivery Events │
                                    │ Analytics Data  │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Analytics & KPI │
                                    │    Dashboard    │
                                    └─────────────────┘
```

---

## ⚙️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Next.js API Routes
* Prisma ORM

### Database

* PostgreSQL

### Authentication

* NextAuth
* Google OAuth

### AI Integration

* OpenRouter

### Deployment

* Vercel

---

## 📂 Core Modules

### Customer Management

Handles customer profiles, customer data ingestion, and purchase history management.

### Segmentation Engine

Converts audience rules into database queries and identifies matching customers.

### AI Assistant

Supports natural language campaign creation, audience targeting, and message generation.

### Campaign Engine

Creates, manages, and executes marketing campaigns.

### Channel Service

Simulates communication delivery and engagement tracking.

### Analytics Dashboard

Tracks campaign performance and customer engagement metrics.

---

## 🚀 Getting Started

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

Create a `.env` file:

```env
DATABASE_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

OPENROUTER_API_KEY=
```

### Setup Database

```bash
npx prisma generate
npx prisma db push
```

### Run Development Server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:3000
```

---

## 🔮 Future Enhancements

* Real messaging provider integrations
* Advanced customer analytics
* Multi-tenant support
* Event-driven campaign processing
* Queue-based message delivery
* AI-powered campaign optimization
* Predictive audience recommendations

---

## 👨‍💻 Author

**Aayush Verma**

GitHub:
https://github.com/AayushVerma16

LinkedIn:
https://www.linkedin.com/
