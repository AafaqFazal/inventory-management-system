# inventory-management-system

# Project Setup Guide

This guide will help you set up and run both the backend and frontend of the project.

---

## 🚀 Backend Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**

   Create a `.env` file in the root of the backend directory with the following variables:

   ```env
   MONGO_URL=your_mongo_connection_string
   PORT=your_preferred_port_number
   ```

3. **Start the Backend Server**

   ```bash
   npm start
   ```

---

## 🌐 Frontend Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**

   Create a `.env` file in the root of the frontend directory with the following variable:

   ```env
   VITE_APP_URL=http://localhost:your_backend_port
   ```

3. **Start the Frontend Server**

   ```bash
   npm run dev
   ```

---

## ✅ Notes

- Make sure the backend server is running before starting the frontend.
- Replace placeholders (e.g., `your_mongo_connection_string`, `your_backend_port`) with actual values based on your configuration.
