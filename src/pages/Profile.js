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
  updatePassword
} from "firebase/auth";

import { db } from "../firebase";
import { toast } from "react-toastify";

const CLOUD_NAME = "dbb3d75pd";
const UPLOAD_PRESET = "posts_upload";

function Profile() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password states
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
      } catch (err) {
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

    } catch (err) {
      toast.update(toastId, {
        render: "Profile update failed ❌",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }

    setLoading(false);
  };

  /* ================= UPDATE PASSWORD ================= */
  const updatePasswordHandler = async () => {
    if (!currentPass.trim() || !newPass.trim())
      return toast.error("Enter both password fields");

    if (!user) return toast.error("Login required");

    const toastId = toast.loading("Updating password...");
    setLoading(true);

    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPass
      );

      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPass);

      toast.update(toastId, {
        render: "Password updated successfully 🔐",
        type: "success",
        isLoading: false,
        autoClose: 2500
      });

      setCurrentPass("");
      setNewPass("");

    } catch (err) {
      toast.update(toastId, {
        render: "Incorrect current password ❌",
        type: "error",
        isLoading: false,
        autoClose: 3500
      });
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>My Profile</h2>

        {profilePic && (
          <img
            src={profilePic}
            alt="profile"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
              margin: "0 auto 20px",
              display: "block"
            }}
          />
        )}

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

       {/* PROFILE PIC UPLOAD
        <input  type="file" placeholder="PROFILE PIC" onChange={(e) => setFile(e.target.files[0])} /> <h6> choose file for profile Pic</h6> */}

        <button onClick={handleUpdate} disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </button>

        {/* ================= CHANGE PASSWORD ================= */}
        <h3 style={{ marginTop: "30px" }}>Change Password</h3>

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

        <button onClick={updatePasswordHandler} disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>

      </div>
    </div>
  );
}

export default Profile;
