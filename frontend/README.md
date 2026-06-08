# MyEdu

MyEdu is a full-stack educational platform designed to provide a seamless learning experience. It includes a backend built with Node.js and Express, and a frontend developed using React and TailwindCSS.

### 🌐 Live Demo: [onlineeducationalplatformlearnbent.vercel.app/user/dashboard](https://onlineeducationalplatformlearnbent.vercel.app/user/dashboard)
---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Folder Structure](#folder-structure)
6. [Scripts](#scripts)
7. [Contributing](#contributing)
8. [License](#license)
9. [Contact Information](#contact-information)

---

## Features

- **User Authentication**: Secure login and registration system.
- **Course Management**: Create, edit, and manage courses.
- **Forum**: Interactive forums for discussions.
- **Quizzes**: Create and attempt quizzes.
- **Admin Dashboard**: Manage users, courses, and forums.
- **Responsive Design**: Optimized for all devices.

---

## Tech Stack

### Backend:
- **Node.js**: JavaScript runtime.
- **Express.js**: Web framework.
- **MongoDB**: Database.
- **Mongoose**: MongoDB object modeling.
- **JWT**: Authentication.
- **Bcrypt**: Password hashing.

### Frontend:
- **React**: UI library.
- **TailwindCSS**: Utility-first CSS framework.
- **Axios**: HTTP client.
- **Framer Motion**: Animations.
- **Highlight.js**: Syntax highlighting.

---

## Installation

### Prerequisites:
- Node.js (v16+)
- npm (v8+)
- MongoDB

### Steps:
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/myedu.git
   cd myedu
   ```

2. Install dependencies:
   - Backend:
     ```bash
     cd backend
     npm install
     ```
   - Frontend:
     ```bash
     cd ../frontend
     npm install
     ```

3. Set up environment variables:
   - Create a `.env` file in the `backend` folder with the following:
     ```
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     ```

4. Start MongoDB:
   ```bash
   mongod
   ```

5. Run the application:
   - Backend:
     ```bash
     cd backend
     npm start
     ```
   - Frontend:
     ```bash
     cd ../frontend
     npm run dev
     ```

---

## Usage

### Live Version:
Visit the deployed application at: [https://onlineeducationalplatformlearnbent.vercel.app/user/dashboard](https://onlineeducationalplatformlearnbent.vercel.app/user/dashboard)

### Local Development:
1. Open your browser and navigate to:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

2. Explore the platform:
   - Register or log in.
   - Browse courses, participate in forums, and take quizzes.

---

## Folder Structure

### Backend:
- `models/`: Database models.
- `routes/`: API routes.
- `middleware/`: Authentication and other middleware.
- `scripts/`: Utility scripts.

### Frontend:
- `src/components/`: React components.
- `src/utils/`: Utility functions.
- `src/contexts/`: Context API for state management.

---

## Scripts

### Backend:
- `npm start`: Start the server.
- `npm run dev`: Start the server in development mode.

### Frontend:
- `npm run dev`: Start the development server.
- `npm run build`: Build the production-ready app.

---

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

---

## License

This project is licensed under the MIT License.

---

## Note on Repository Privacy

This project is kept private on GitHub to maintain confidentiality and protect sensitive information, such as proprietary code, database configurations, and other internal assets. However, this `README.md` file is shared in a separate public repository to showcase the project's features, tech stack, and usage details. This allows others to understand the scope and functionality of the project without exposing the actual source code.

If you have any questions or would like to collaborate, feel free to reach out!

---

## Contact Information

- **LinkedIn**: [Vishesh Yadav](https://linkedin.com/in/vishesh-yadav-)
- **Email**: visheshyadav62@gmail.com

---

## Project Overview

MyEdu is a comprehensive educational platform designed to enhance the learning experience for students and educators. The platform provides a variety of features to facilitate learning, collaboration, and management of educational content. Below is a detailed explanation of the key components and functionalities:

### Key Features

1. **User Authentication**:
   - Secure login and registration system using JWT (JSON Web Tokens).
   - Passwords are hashed using Bcrypt for enhanced security.

2. **Course Management**:
   - Admins can create, edit, and manage courses.
   - Students can browse and enroll in courses.
   - Detailed course content with multimedia support.

3. **Forum**:
   - Interactive forums for students and educators to discuss topics.
   - Moderation tools for admins to manage forum content.

4. **Quizzes**:
   - Create and manage quizzes for courses.
   - Students can attempt quizzes and view their scores.

5. **Admin Dashboard**:
   - Manage users, courses, and forums.
   - View analytics and reports on platform usage.

6. **Responsive Design**:
   - Fully optimized for desktops, tablets, and mobile devices.

### Backend Details

- **Framework**: Built with Express.js, a fast and lightweight web framework for Node.js.
- **Database**: MongoDB is used for storing user data, course content, forum posts, and quiz data.
- **Middleware**:
  - Authentication middleware to protect routes.
  - Rate limiting and security headers using Helmet and Express Rate Limit.
- **APIs**:
  - RESTful APIs for user authentication, course management, forum interactions, and quiz handling.

### Frontend Details

- **Framework**: Developed using React.js for a dynamic and interactive user interface.
- **Styling**: TailwindCSS is used for a modern and responsive design.
- **State Management**: Context API is used for managing global state.
- **Animations**: Framer Motion is integrated for smooth animations.
- **Code Highlighting**: Highlight.js is used for syntax highlighting in course content.

### Deployment

- The backend server is deployed on a Node.js environment.
- The frontend is built and deployed on Vercel: [https://onlineeducationalplatformlearnbent.vercel.app/user/dashboard](https://onlineeducationalplatformlearnbent.vercel.app/user/dashboard)
- MongoDB Atlas is used for cloud-based database hosting.

### Use Cases

- **For Students**:
  - Access a wide range of courses.
  - Participate in forums to discuss topics and clarify doubts.
  - Take quizzes to test knowledge and track progress.

- **For Educators**:
  - Create and manage course content.
  - Engage with students through forums.
  - Monitor student progress and performance.

- **For Admins**:
  - Oversee platform operations.
  - Manage users, courses, and forums.
  - Ensure the platform runs smoothly and securely.

This detailed explanation provides a deeper insight into the MyEdu platform, its architecture, and its use cases.
