# Finance Tracker Pro

A full-stack Finance Tracker built with React (Vite), Node.js (Express), and MongoDB. Features dynamic schema support for custom labels and roles.

## Features
- **Dynamic Roles**: Choose or specify any role during signup.
- **Custom Transactions**: Add unique labels and metadata to any transaction.
- **Visual Analytics**: Beautiful charts for income vs expense and spending distribution.
- **Responsive Design**: Premium dark mode and glassmorphism UI.

## Local Setup

### Backend
1. Go to `backend` folder.
2. Run `npm install`.
3. Create a `.env` file with:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5001
   ```
4. Run `npm run dev` or `node server.js`.

### Frontend
1. Run `npm install` in the root directory.
2. Run `npm run dev`.
3. Open `http://localhost:5173`.

## Hosting Note
To host this project live:
1. **Frontend**: Can be hosted on Vercel or Netlify.
2. **Backend**: Can be hosted on Render, Railway, or Heroku.
3. **Database**: Use MongoDB Atlas (Cloud).
