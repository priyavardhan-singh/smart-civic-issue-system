# Smart Civic Issue Reporting & Management System

A full-stack civic issue reporting and management platform where citizens can report local problems, administrators can assign and manage complaints, and officers can update and resolve assigned issues with proof.

The project includes:

- Web application
- Mobile application
- Backend API
- MongoDB database
- Cloud image storage
- Role-based authentication
- Live deployment

---

## Project Overview

The Smart Civic Issue Reporting & Management System helps citizens report civic problems such as:

- Road damage / potholes
- Streetlight problems
- Garbage / waste
- Water / drainage issues
- Sewage problems
- Other civic issues

Citizens can submit complaints with:

- Issue category
- Description
- Photo
- GPS/location
- Address

Administrators can manage complaints, departments, and officers.

Officers can view assigned complaints, start work, submit resolution remarks, and upload proof photos after resolving the issue.

---

## User Roles

### Citizen

Citizens can:

- Register and login
- Report civic issues
- Upload issue photos
- Select location using GPS, search, or map
- View submitted reports
- Track complaint status
- View activity timeline
- View officer resolution remarks
- View resolution proof images
- Manage profile information

### Admin

Administrators can:

- Login securely
- View all reports
- Search and filter reports
- View complete report details
- Create and manage departments
- Create and manage officers
- Assign reports to departments and officers
- Monitor report progress
- View completed resolution details

### Officer

Officers can:

- Login using officer account
- View assigned reports
- View report location and issue details
- Start work on assigned issues
- Enter resolution remarks
- Upload resolution proof image
- Mark assigned reports as resolved

---

## Technology Stack

### Web Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Leaflet
- React Leaflet
- OpenStreetMap

### Mobile Application

- React Native
- Expo
- Expo Router
- Expo Location
- Expo Image Picker
- React Native Maps
- Expo Secure Store

### Backend

- Python
- FastAPI
- Uvicorn
- PyMongo
- JWT Authentication
- pwdlib / Argon2 password hashing
- Python Multipart

### Database

- MongoDB Atlas

### Image Storage

- Cloudinary

### Deployment

- Render
- MongoDB Atlas
- Cloudinary

---

## System Architecture

```text
                ┌─────────────────────┐
                │     Web Frontend    │
                │   React + Vite      │
                └─────────┬───────────┘
                          │
                          │ REST API
                          │
                          ▼
                ┌─────────────────────┐
                │      FastAPI        │
                │      Backend        │
                └───────┬─────┬───────┘
                        │     │
                        │     │
                        ▼     ▼
                ┌──────────┐  ┌────────────┐
                │ MongoDB  │  │ Cloudinary │
                │  Atlas   │  │   Images   │
                └──────────┘  └────────────┘
                        ▲
                        │
                        │ REST API
                        │
                ┌───────┴─────────────┐
                │   Mobile App        │
                │ React Native + Expo │
                └─────────────────────┘