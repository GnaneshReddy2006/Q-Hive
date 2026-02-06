import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import { supabase } from "./supabase.js"; // IMPORTANT: Ensure this import path is correct

import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import DeleteAccount from "./pages/DeleteAccount";
import CreatePost from "./pages/CreatePost";
import Posts from "./pages/Posts";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =============== FIREBASE AUTH LISTENER ===============
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // =============== WAKE SUPABASE ON APP LOAD (FIX MOBILE POST FAIL) ===============
  useEffect(() => {
    const wakeSupabase = async () => {
      try {
        await supabase.from("posts").select("id").limit(1);
        console.log("🔵 Supabase is awake and ready");
      } catch (err) {
        console.log("❌ Supabase wake error:", err.message);
      }
    };

    wakeSupabase();
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
          <Link to={user ? "/posts" : "/login"} className="logo">
            Q-Hive
          </Link>
        </div>

        {/* CENTER */}
        <div className="nav-center">
          {user && (
            <>
              <Link className="nav-link" to="/create">Create Post</Link>
              <Link className="nav-link" to="/posts">View Posts</Link>
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

          {user && (
            <>
              <Logout />
              <DeleteAccount />
            </>
          )}
        </div>

      </nav>

      {/* ================= ROUTES ================= */}
      <Routes>

        {/* Public */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Default */}
        <Route
          path="/"
          element={user ? <Navigate to="/posts" /> : <Navigate to="/login" />}
        />

        {/* Protected */}
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

      {/* ================= TOAST ================= */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        pauseOnHover
        closeOnClick
        theme="colored"
      />

    </BrowserRouter>
  );
}

export default App;
