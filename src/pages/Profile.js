import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
  deleteUser
} from "firebase/auth";

import { db } from "../firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CLOUD_NAME = "dbb3d75pd";
const UPLOAD_PRESET = "posts_upload";

function Profile() {

  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setBranch(data.branch || "");
          setYear(data.year || "");
          setProfilePic(data.profilePic || "");
        }
      } catch {
        toast.error("Failed to load profile ❌");
      }
    };

    fetchProfile();
  }, [user]);

  /* ================= UPDATE PROFILE ================= */
  const handleUpdate = async () => {

    if (!user) return toast.error("You must be logged in");

    setLoading(true);
    const toastId = toast.loading("Updating profile...");

    try {

      let imageUrl = profilePic;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );

        const data = await res.json();
        imageUrl = data.secure_url;
      }

      await updateDoc(doc(db, "users", user.uid), {
        name,
        branch,
        year,
        profilePic: imageUrl
      });

      toast.update(toastId, {
        render: "Profile updated successfully ✅",
        type: "success",
        isLoading: false,
        autoClose: 2500
      });

    } catch {

      toast.update(toastId, {
        render: "Profile update failed ❌",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }

    setLoading(false);
  };

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  /* ================= DELETE ACCOUNT ================= */
  const handleDeleteAccount = async () => {

    if (!currentPass.trim())
      return toast.error("Enter current password");

    try {

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPass
      );

      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);

      toast.success("Account deleted successfully ❌");
      navigate("/signup");

    } catch {
      toast.error("Failed to delete account");
    }
  };

  /* ================= UPDATE PASSWORD ================= */
  const updatePasswordHandler = async () => {

    if (!currentPass || !newPass)
      return toast.error("Enter both password fields");

    try {

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPass
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);

      toast.success("Password updated 🔐");

      setCurrentPass("");
      setNewPass("");

    } catch {
      toast.error("Incorrect current password ❌");
    }
  };

  return (
    <div className="container">

      <div className="card">

        <h2>My Profile</h2>

        <button onClick={handleLogout}>
          Logout
        </button>

        <button
          style={{ background: "red", color: "white" }}
          onClick={handleDeleteAccount}
        >
          Delete Account
        </button>


        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          className="input"
          placeholder="Branch"
          value={branch}
          onChange={e => setBranch(e.target.value)}
        />

        <input
          className="input"
          type="number"
          placeholder="Year"
          value={year}
          onChange={e => setYear(e.target.value)}
        />

      
        <button onClick={handleUpdate} disabled={loading}>
          Update Profile
        </button>

        <h3>Change Password</h3>

        <input
          className="input"
          type="password"
          placeholder="Current Password"
          value={currentPass}
          onChange={(e) => setCurrentPass(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="New Password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
        />

        <button onClick={updatePasswordHandler}>
          Update Password
        </button>

        <hr />

        
      </div>
    </div>
  );
}

export default Profile;
