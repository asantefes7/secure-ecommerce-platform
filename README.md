# Secure E-Commerce Platform with Advanced Fraud Detection

## Overview
This capstone project presents **ShieldShop**, a modern e-commerce platform built with the MERN stack. 
The system focuses on **security** and **fraud prevention** while providing a smooth shopping experience.

Key security features include:
- Email-based OTP authentication for login, registration, and high-risk checkout.
- Real-time fraud detection using geolocation (Haversine distance), transaction velocity, and rule-based scoring.
- Login rate limiting (3 failed attempts in 10 minutes → 60-minute account lockout).
- Flagged orders with detailed reasons visible to admins.
- Secure payments via Stripe (test mode).

## Project Objectives
- Design and implement a secure e-commerce app adhering to industry standards.
- Integrate ML for real-time fraud detection.
- Demonstrate full-stack skills.
- Evaluate performance and produce documentation.


## Tech Stack
**Frontend**
- React.js (with Hooks and React Router)
- Axios (API calls)
- React Toastify (notifications)
- Bootstrap + custom CSS (responsive UI)
- React Slick (carousel)

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT (authentication)
- bcryptjs (password hashing)
- Nodemailer (OTP and order emails)
- Stripe (payment processing)

**Tools**
- Git & GitHub (version control)
- Postman (API testing)
- Visual Studio Code
- MongoDB Compass. 

## Features

- User registration and login with OTP verification.
- Product browsing with category filter, search, size & color selection.
- Shopping cart with persistent storage.
- Secure checkout with real-time fraud scoring and OTP.
- Order history with detailed status and flagged order explanations.
- Favorites / Wishlist.
- Admin dashboard for flagged orders and status management.
- Login rate limiting to prevent brute-force attacks.


## Future Enhancements

- Production deployment (Render + Vercel).
- Advanced ML models for fraud detection.
- Mobile-responsive improvements.
- Payment webhook handling.
- Comprehensive automated testing.

## Setup Instructions (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/asantefes7/secure-ecommerce-platform.git
cd secure-ecommerce-platform

### 2. Backend Setup
cd Backend
npm install

- Create .env file in the Backend folder with: 
PORT=5001
MONGO_URI=mongodb://localhost:27017/ecommerce-db
JWT_SECRET=your_jwt_secret_here
STRIPE_SECRET_KEY=sk_test_...
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

Start the backend:
npm run dev

### Frontend Setup 
cd frontend
npm install
npm start

The application will be available at http://localhost:3000 
Note: Make sure MongoDB is running locally on port 27017. 