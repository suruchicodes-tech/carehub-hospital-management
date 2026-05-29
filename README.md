# CareHub Real OTP Backend

This backend serves the browser website and provides real OTP APIs.

## Setup

1. Copy `.env.example` to `.env`.
2. Add your MSG91 values:
   - `MSG91_AUTH_KEY`
   - `MSG91_TEMPLATE_ID`
   - optional `MSG91_SENDER_ID`
3. Start the server:

```powershell
node "C:\hms project\hospital management system\backend\server.js"
```

4. Open:

```text
http://127.0.0.1:8090
```

## Provider Choice

`OTP_PROVIDER=msg91` is the default and recommended option. If MSG91 fails and `FAST2SMS_API_KEY` is set, the server can try Fast2SMS as a fallback.

## Important

Do not commit or share `.env`. Keep API keys secret.

# CareHub Hospital Management System 🚀

A full-stack Hospital Management System developed to manage patients, doctors, appointments, and hospital records efficiently. This project helps streamline hospital operations through a simple and user-friendly interface.

## 🌐 Live Demo
🔗 https://carehub-hospital-management-production-97da.up.railway.app/

## 📌 Features
- Patient Management
- Doctor Management
- Appointment Booking
- Hospital Record Management
- Responsive User Interface
- CRUD Operations
- Database Integration

## 🛠️ Tech Stack
- Java
- Spring Boot
- MySQL
- HTML
- CSS
- JavaScript
- Thymeleaf
- Git & GitHub
- Railway Deployment

## 🚀 Deployment
This project is successfully deployed on Railway and accessible online from anywhere.

## 📂 GitHub Repository
Developed and maintained by Suruchi.

## 📖 Learning Outcome
Through this project, I learned:
- Backend development using Spring Boot
- Database connectivity with MySQL
- Full-stack project structure
- GitHub version control
- Live deployment using Railway

---
⭐ If you like this project, feel free to star the repository.
