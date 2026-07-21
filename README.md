# SecureGate
### Smart Contractor & Visitor Access Management System
 <img width="1919" height="1117" alt="image" src="https://github.com/user-attachments/assets/5e2f91a1-dec4-48ab-b8a1-1f26ee069ce4" />

> ⚠️ **This branch is under active development.** Features are being implemented incrementally.
 
**Group 6 (Infinity) · President University · 2026**
 
---

## Getting Started
 
**1. Clone & install:**
```bash
git clone https://github.com/group-6-infinity/smart-contractor-visitor-access-management-system.git
cd smart-contractor-visitor-access-management-system
npm install
```
 
**2. Setup environment:**
```bash
cp .env.example .env
```
 
```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-auth-secret"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
 
**3. Setup database:**
```bash
npx prisma generate
npx prisma db push
```
 
**4. Run dev server:**
```bash
npm run dev
```
 
Open [http://localhost:3000](http://localhost:3000)
 
---

## Team
 
| Name | Role |
|------|------|
| Wilbert Leonard Harriman | Project Manager & QA |
| Shafa Nabilah Rizqullah Famahira | Business Analyst |
| Nailha Sakhila Dewi | Lead Developer & Designer |
| Tessalonika Angeline Purba | Developer & Designer |
 
---
