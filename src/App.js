import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import CreatePost from "./pages/CreatePost";
import Posts from "./pages/Posts";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>;
  }

  return (
    <BrowserRouter>

      {/* ================= NAVBAR ================= */}
      <nav className="navbar">

        {/* LEFT */}
        <div className="nav-left">
          <Link to={user ? "/posts" : "/login"} className="logo">Q-Hive</Link>
        </div>

        {/* CENTER */}
        <div className="nav-center">
          {user && (
            <>
              <Link className="nav-link" to="/create">Create</Link>
              <Link className="nav-link" to="/posts">Posts</Link>
              <Link className="nav-link" to="/profile">Profile</Link>
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="nav-right">
          {!user && (
            <>
              <Link className="nav-link" to="/login">Login</Link>
              <Link className="nav-link" to="/signup">Signup</Link>
            </>
          )}
          {user && <Logout />}
        </div>

      </nav>

      {/* ================= ROUTES ================= */}
      <Routes>

        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Default Route */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/posts" /> : <Navigate to="/login" />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/create"
          element={
            <ProtectedRoute user={user}>
              <CreatePost />
            </ProtectedRoute>
          }
        />

        <Route
          path="/posts"
          element={
            <ProtectedRoute user={user}>
              <Posts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <Profile />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
