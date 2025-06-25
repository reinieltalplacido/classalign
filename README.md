# 📚 ClassAlign

ClassAlign is a clean, personal class scheduling tool built with Next.js, TailwindCSS, and Supabase — designed for teachers, department members, or anyone needing a smart way to organize their weekly classroom schedules.

It combines manual scheduling with AI-powered suggestions via OpenRouter (TempoAI), helping users avoid time conflicts and plan smarter.

---

## 🚀 Features

- 🔐 Authentication with Supabase
  - Email/password login
  - Each user gets their own saved schedule

- 📅 Weekly Schedule Management
  - Add/edit/delete class schedules
  - Conflict detection to avoid overlaps
  - Assign subjects to rooms and timeslots easily

- 🤖 AI Schedule Suggestion (via OpenRouter)
  - Powered by Mistral or Qwen
  - Prompts the AI to suggest free slots based on current data

- 💾 Supabase Database Integration
  - All schedules are saved per-user
  - Real-time updates and persistent storage

- 🎨 Clean UI and UX
  - TailwindCSS styled interface
  - Mobile-first responsive layout
  - Calendar-like view for 1-day and full-week schedules

- 📤 Export/Print Support *(coming soon)*
  - Easily print or export your schedule for sharing

---

## 🛠️ Tech Stack

- Next.js – React framework for fast, modern web apps
- TailwindCSS – Utility-first CSS for clean UI
- Supabase – Auth and database backend
- OpenRouter – AI suggestions using Mistral or Qwen models
- FullCalendar.js *(optional)* – For enhanced calendar UI

---
