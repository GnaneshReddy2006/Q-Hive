import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { supabase } from "../supabase";

function CreatePost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = getAuth().currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Login required");

    setLoading(true);

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
        fileType = file.type; // e.g. video/mp4
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
      alert("Post created ✅");
    } catch (err) {
      console.error(err);
      alert("Post failed ❌");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Create Post</h2>

        <form onSubmit={handleSubmit} className="create-form">
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

          {/* ✅ Accept videos also */}
          <input
            type="file"
            accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
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
