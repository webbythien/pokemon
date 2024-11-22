
# Pokemon Application

This repository contains a full-stack application consisting of a backend REST API and a frontend user interface. The backend is built with Express.js, while the frontend is developed using Angular. MongoDB is used for data storage, and Docker is employed to simplify the setup process.

---

## **Features**

- **Backend**: 
  - RESTful API with Express.js.
  - JWT-based authentication.
  - MongoDB as the database.
  
- **Frontend**:
  - Angular application with JWT authentication.
  - User-friendly interface for login and interaction.

- **Database**:
  - MongoDB, managed through Docker.

---

## **Repository Structure**

```plaintext
pokemon/
├── mongo-db.yml              # Docker configuration for MongoDB
├── express-rest-boilerplate/ # Backend service
│   ├── .env.example          # Environment variable example file
│   ├── package.json          # Backend dependencies
│   ├── src/                  # Source code for the API
│   └── ...
├── angular_18_login_with_jwt_token/ # Frontend service
│   ├── package.json           # Frontend dependencies
│   ├── src/                   # Source code for Angular application
│   └── ...
└── README.md                 # Documentation
```

## Setup Instructions

Follow these steps to set up and run the application locally.

### Prerequisites
Ensure you have the following installed:
- Docker
- Node.js
- npm

### **Step 1: Clone the Repository**
Clone the repository to your local machine:
```bash
git clone https://github.com/webbythien/pokemon.git
cd pokemon
```

### **Step 2: Start Docker Services**
The repository includes a preconfigured `docker-compose.yml` file for setting up MongoDB. Start the services using:

```bash
docker-compose -f mongo-db.yml up -d --build
```

This command will:
* Start a MongoDB container with the following credentials:
   * **Username**: `root`
   * **Password**: `exevipvl`
   * **Port**: `27017`

Verify that the MongoDB container is running:
```bash
docker ps
```

### **Step 3: Backend Setup (Express REST Boilerplate)**
1. Navigate to the backend directory:
```bash
cd express-rest-boilerplate
```

2. Install dependencies:
```bash
npm install
```

3. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

4. Start the backend server:
```bash
npm run dev
```

### **Step 4: Frontend Setup (Angular 18 with JWT Authentication)**
1. Navigate to the frontend directory:
```bash
cd ../angular_18_login_with_jwt_token
```

2. Install dependencies:
```bash
npm install
```

3. Start the Angular development server:
```bash
npm start
```

### **Step 5: Verify the Application**
* **Backend**: Visit `http://localhost:3000` to confirm the REST API is running. Use an API client like Postman to test endpoints.
* **Frontend**: Visit `http://localhost:4200` in your browser to access the Angular application.

## **Usage**
1. Start by registering a user through the Angular frontend.
2. Login to obtain a JWT token.
3. Use the token to interact with protected API endpoints.

## **Commands Summary**
Start Docker Services
```bash
docker-compose up -d
```

Backend Setup
```bash
cd express-rest-boilerplate
npm install
cp .env.example .env
npm run dev
```

Frontend Setup
```bash
cd angular_18_login_with_jwt_token
npm install
npm start
```

## **Troubleshooting**

1. **MongoDB Connection Issues**:
   * Ensure the Docker container is running using `docker ps`
   * Verify the `MONGO_URI` in the `.env` file matches the MongoDB container configuration.

2. **Backend Issues**:
   * Delete `node_modules` and reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

3. **Frontend Issues**:
   * Ensure the backend server is running and accessible.

## **Future Enhancements**
* Add unit and integration tests for both backend and frontend.
* Improve frontend UI/UX with additional features.
* Set up a CI/CD pipeline for automated testing and deployment.

**Happy Coding! 😊**
