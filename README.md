# 🎯 EventDashboard

![Next.js](https://img.shields.io/badge/Next.js-14-blue?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg?logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-13aa52?logo=mongodb)
![License](https://img.shields.io/github/license/AzidMuhammad/EventDashboard)
![Status](https://img.shields.io/badge/Status-Development-yellow)

> Dashboard manajemen event & kompetisi digital terintegrasi dengan sistem autentikasi dan notifikasi Telegram Bot — dibangun menggunakan Next.js 14, TypeScript, dan MongoDB.

---

## 📚 Table of Contents

- [✨ Features](#-features)
- [📦 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Installation](#️-installation)
- [🚀 Usage](#-usage)
- [📌 Environment Variables](#-environment-variables)
- [📸 Preview](#-preview)
- [🧩 Modules](#-modules)
- [🧑‍💻 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

- 🔐 **Authentication** — NextAuth.js dengan login aman
- 🧑‍🤝‍🧑 **Manajemen Peserta** — CRUD peserta event
- 📝 **Proposal & Kompetisi** — Modul pengelolaan proposal
- 💰 **Keuangan Event** — Tracking pengeluaran dan pemasukan
- 🔔 **Notifikasi Telegram** — Terintegrasi dengan Telegram Webhook
- 📊 **Dashboard Interaktif** — Analisis visual kompetisi
- 🧠 Modular & scalable — Struktur file dan folder terorganisir

---

## 📦 Tech Stack

| Layer        | Tools / Frameworks                            |
|--------------|-----------------------------------------------|
| Frontend     | [Next.js 14](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [TypeScript](https://www.typescriptlang.org/) |
| Backend      | [MongoDB](https://www.mongodb.com/), [Telegram Bot API](https://core.telegram.org/bots/api) |
| Auth         | [NextAuth.js](https://next-auth.js.org/)      |
| State & Hook | React, Context API                            |
| UI Icons     | [Lucide](https://lucide.dev/), [Heroicons](https://heroicons.com/) |
| Notifications| [react-hot-toast](https://react-hot-toast.com)|

---

## 📁 Project Structure
```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/login/        # Halaman login
│   └── dashboard/           # Halaman utama dashboard
│       ├── competitions/    # Manajemen kompetisi
│       ├── finances/        # Modul keuangan
│       ├── notifications/   # Modul notifikasi
│       ├── participants/    # Manajemen peserta
│       └── proposals/       # Modul proposal
│
├── components/              # Komponen UI global
├── modules/                 # Logika bisnis per fitur (Domain modules)
├── lib/                     # Helper & utilitas umum
├── types/                   # Tipe data global (TypeScript interfaces)
├── styles/                  # Global styles (Tailwind CSS)
└── utils/                   # Fungsi utilitas tambahan
```
---

## ⚙️ Installation

1. **Clone repository:**

```
git clone https://github.com/AzidMuhammad/EventDashboard.git
cd EventDashboard
```
2. **Install dependencies:**
```
npm install
```
3. **Setup environment variables:**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/lomba-17-agustus
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
```
4. **Jalankan development server:**
```
npm run dev
```
