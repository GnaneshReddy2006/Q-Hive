import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { supabase } from "../supabase";
import { toast } from "react-toastify";

function CreatePost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = getAuth().currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");

    if (!title.trim()) return toast.error("Title required");

    setLoading(true);
    const toastId = toast.loading("Posting...");

    try {
      let fileUrl = "";
      let fileType = "";

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileName = `${user.uid}_${Date.now()}_${safeName}`;

        const { error } = await supabase.storage
          .from("documents")
          .upload(fileName, file);

        if (error) throw error;

        const { data } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName);

        fileUrl = data.publicUrl;
        fileType = file.type || "application/octet-stream";
      }

      await addDoc(collection(db, "posts"), {
        title,
        description,
        fileUrl,
        fileType,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setTitle("");
      setDescription("");
      setFile(null);

      toast.update(toastId, {
        render: "Post created successfully ✅",
        type: "success",
        isLoading: false,
        autoClose: 2500
      });

    } catch (err) {
      console.error(err);
      toast.update(toastId, {
        render: "Post failed ❌",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Create Post</h2>

        <form onSubmit={handleSubmit}>
          <input
            className="crePost"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="crePost"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* 🔥 ALL FILE TYPES */}
          <input
            type="file"
            accept="*/*"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button className="crePost" disabled={loading}>
            {loading ? "Posting..." : "Create Post"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;
