# 💬 Classmate Real-Time Chat App

A fullstack real-time chat application with authentication, username search, and direct/group messaging.

---

## ⚡ Quick 5-Minute Free Deployment Guide

### Part 1: Deploy Backend (Render.com)
1. Push this folder to a GitHub repository.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Select your repo, and set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Copy your Render backend URL (e.g., `https://chat-server-123.onrender.com`).

### Part 2: Deploy Frontend (Vercel.com)
1. In `client/src/App.jsx`, update the `SOCKET_URL` or add an environment variable in Vercel:
   `VITE_BACKEND_URL=https://chat-server-123.onrender.com`
2. Push your code to GitHub.
3. Sign in to [Vercel.com](https://vercel.com) and click **Add New Project**.
4. Choose the repository and set the **Root Directory** to `client`.
5. Click **Deploy**. Vercel will give you a public URL (e.g., `https://classmate-chat.vercel.app`).
6. Share that URL with your classmates!
