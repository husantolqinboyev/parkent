# 🚀 Parkent Market Hub Deployment Guide

## 📋 Deployment Plan

### 1. Backend Deployment (Render.com)

#### 1.1. GitHub ga yuborish
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 1.2. Render.com da yangi Web Service
1. [Render.com](https://render.com) ga kirish
2. **New +** → **Web Service**
3. GitHub repository ni tanlash
4. **Build & Deploy** sozlamalari:
   - **Name**: `parkent-market-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 1.3. Environment Variables
Render.com da Environment Variables qo'shish:
```
NODE_ENV=production
PORT=10000
TELEGRAM_BOT_TOKEN=8389652893:AAGPVN7GwrokASMZcInn-BlvaddCBj_AsLg
SUPABASE_URL=https://yvxcxbnifylikrcqxuwc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2eGN4Ym5pZnlsaWtyY3F4dXdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYwMTE1OCwiZXhwIjoyMDg1MTc3MTU4fQ.km8-oOPknRkTV2jM2ZDAtGN9-eSuP_AtFCpMF3qjmRA
```

#### 1.4. Backend URL
Deployment tugagandan so'ng backend URL ni oling:
`https://parkent-market-backend.onrender.com`

---

### 2. Frontend Deployment (Vercel)

#### 2.1. Vercel ga import qilish
1. [Vercel.com](https://vercel.com) ga kirish
2. **New Project** → GitHub repository tanlash
3. Root directory: `fronted`
4. Framework preset: **Vite**

#### 2.2. Environment Variables
Vercel da Environment Variables qo'shish:
```
VITE_SUPABASE_URL=https://yvxcxbnifylikrcqxuwc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2eGN4Ym5pZnlsaWtyY3F4dXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDExNTgsImV4cCI6MjA4NTE3NzE1OH0.KbNlUsIx70nFkdS3LGYU0pn8YXp5tNwBAiXn3HrKfyU
VITE_API_BASE_URL=https://parkent-market-backend.onrender.com
```

#### 2.3. Deploy
**Deploy** tugmasini bosing

---

### 3. Supabase Migration Update

#### 3.1. Cron job URL ni yangilash
Supabase Dashboard → SQL Editor da quyidagini bajaring:

```sql
-- Cron job ni yangi backend URL bilan yangilash
SELECT cron.unschedule('cleanup-expired-listings');

SELECT cron.schedule(
  'cleanup-expired-listings',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://parkent-market-backend.onrender.com/api/cleanup-expired',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 🔗 Final URLs

- **Frontend**: `https://parkent-market-hub.vercel.app`
- **Backend**: `https://parkent-market-backend.onrender.com`
- **Supabase**: `https://yvxcxbnifylikrcqxuwc.supabase.co`

---

## ✅ Testing Checklist

### Backend Testing
- [ ] `https://parkent-market-backend.onrender.com/api/health` - should return `{"status":"ok"}`
- [ ] `https://parkent-market-backend.onrender.com/api/telegram/auth` - should handle POST requests
- [ ] `https://parkent-market-backend.onrender.com/api/admin` - should handle admin requests

### Frontend Testing
- [ ] Sayt ochiladi
- [ ] Telegram bot `/start` komandasi ishlaydi
- [ ] Admin paneli yuklanadi
- [ ] E'lonlar ko'rsatiladi

### Integration Testing
- [ ] Telegram autentifikatsiyasi ishlaydi
- [ ] Admin paneli backend bilan bog'lanadi
- [ ] CORS xatoliklari yo'q

---

## 🚨 Troubleshooting

### CORS Errors
Backendda CORS origin larni tekshiring:
```javascript
origin: [
  'http://localhost:8080',
  'https://parkent-market-hub.vercel.app'
]
```

### Telegram Bot Issues
Bot polling ishlashi uchun backend ishga tushishi kerak.

### Environment Variables
Barcha environment variables to'g'ri ekanligiga ishonch hosil qiling.

---

## 🎉 Success!

Deployment tugagandan so'ng loyiha to'liq ishlaydi:
- ✅ Frontend Vercel da
- ✅ Backend Render da  
- ✅ Supabase database
- ✅ Telegram bot
- ✅ Admin paneli
# parkent
