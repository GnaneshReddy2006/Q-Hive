import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { supabase } from "../supabase";

function Posts() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});

  // Filters
  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

  /* ================= AUTH ================= */
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  /* ================= LIKES ================= */
  const fetchLikes = async () => {
    const snap = await getDocs(collection(db, "likes"));
    const count = {};
    snap.forEach((d) => {
      const { postId } = d.data();
      count[postId] = (count[postId] || 0) + 1;
    });
    setLikes(count);
  };

  /* ================= COMMENTS ================= */
  const fetchComments = async (postId) => {
    const q = query(collection(db, "comments"), where("postId", "==", postId));
    const snap = await getDocs(q);
    setComments((p) => ({
      ...p,
      [postId]: snap.docs.map((d) => d.data()),
    }));
  };

  /* ================= FETCH POSTS ================= */
  const fetchAllPosts = useCallback(async () => {
    const snap = await getDocs(collection(db, "posts"));
    const postList = [];

    for (const d of snap.docs) {
      const post = { id: d.id, ...d.data() };

      if (post.userId) {
        const userSnap = await getDoc(doc(db, "users", post.userId));
        const u = userSnap.exists() ? userSnap.data() : {};
        post.userBranch = u.branch || "N/A";
        post.userYear = u.year || "N/A";
      }

      postList.push(post);
    }

    postList.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    setPosts(postList);
    setFilteredPosts(postList);

    fetchLikes();
    postList.forEach((p) => fetchComments(p.id));
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  /* ================= FILTER LOGIC ================= */
  useEffect(() => {
    let updated = [...posts];

    if (branchFilter !== "All") {
      updated = updated.filter((p) => p.userBranch === branchFilter);
    }

    if (yearFilter !== "All") {
      updated = updated.filter((p) => String(p.userYear) === yearFilter);
    }

    if (searchText.trim() !== "") {
      updated = updated.filter(
        (p) =>
          p.title.toLowerCase().includes(searchText.toLowerCase()) ||
          p.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredPosts(updated);
  }, [branchFilter, yearFilter, searchText, posts]);

  /* ================= DELETE POST ================= */
  const deletePost = async (postId, fileUrl) => {
    const ok = window.confirm("Delete this post?");
    if (!ok) return;

    try {
      if (fileUrl) {
        const fileName = fileUrl.split("/").pop();
        await supabase.storage.from("documents").remove([fileName]);
      }

      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setFilteredPosts((prev) => prev.filter((p) => p.id !== postId));

      alert("Post deleted ✔️");
    } catch (err) {
      console.error(err);
      alert("Deletion failed ❌");
    }
  };

  /* ================= LIKE ================= */
  const toggleLike = async (postId) => {
    if (!user) return alert("Login required");

    const qLike = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(qLike);

    if (!snap.empty) {
      snap.forEach((d) => deleteDoc(doc(db, "likes", d.id)));
      setLikes((p) => ({
        ...p,
        [postId]: Math.max((p[postId] || 1) - 1, 0),
      }));
    } else {
      await addDoc(collection(db, "likes"), { postId, userId: user.uid });
      setLikes((p) => ({ ...p, [postId]: (p[postId] || 0) + 1 }));
    }
  };

  /* ================= ADD COMMENT ================= */
  const addComment = async (postId) => {
    if (!user || !newComment[postId]?.trim()) return;

    await addDoc(collection(db, "comments"), {
      postId,
      userId: user.uid,
      text: newComment[postId],
      createdAt: serverTimestamp(),
    });

    setNewComment((p) => ({ ...p, [postId]: "" }));
    fetchComments(postId);
  };

  /* ================= UI ================= */
  return (
    <div className="posts-container">
      <h2>All Posts</h2>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="All">All Branches</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="CSM">CSM</option>
          <option value="CSD">CSD</option>
          <option value="MECH">MECH</option>
          <option value="CIVIL">CIVIL</option>
        </select>

        <select className="filter-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="All">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>

        <input
          className="filter-input"
          placeholder="Search…. (Title/Description)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* POSTS */}
      {filteredPosts.map((post) => (
        <div className="post-card" key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
          <p><strong>{post.userBranch}</strong> | Year {post.userYear}</p>

          {/* 🖼 IMAGE */}
          {post.fileType?.startsWith("image") && (
            <img src={post.fileUrl} alt="post" />
          )}

          {/* 🎥 VIDEO */}
          {post.fileType?.startsWith("video") && (
            <video
              src={post.fileUrl}
              controls
              style={{ width: "100%", borderRadius: "10px", marginTop: "12px" }}
            />
          )}

          {/* 📄 PDF */}
          {post.fileType === "application/pdf" && (
            <div style={{ marginTop: "8px" }}>
              <a href={post.fileUrl} target="_blank" rel="noreferrer">📄 View PDF</a><br />
              <a href={post.fileUrl} download>⬇️ Download PDF</a>
            </div>
          )}

          {/* 📁 OTHER FILES */}
          {post.fileUrl &&
            !post.fileType?.startsWith("image") &&
            !post.fileType?.startsWith("video") &&
            post.fileType !== "application/pdf" && (
              <div style={{ marginTop: "8px" }}>
                <a href={post.fileUrl} download>⬇️ Download File</a>
              </div>
            )}

          {/* LIKE + DELETE */}
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center" }}>
            <button onClick={() => toggleLike(post.id)}>❤️ {likes[post.id] || 0}</button>

            {user && user.uid === post.userId && (
              <button className="delete-btn" onClick={() => deletePost(post.id, post.fileUrl)}>
                Delete
              </button>
            )}
          </div>

          {/* COMMENTS */}
          <div className="comment-box">
            <input
              className="comment-input"
              placeholder="Comment…"
              value={newComment[post.id] || ""}
              onChange={(e) => setNewComment((p) => ({ ...p, [post.id]: e.target.value }))}
            />
            <button className="comment-send" onClick={() => addComment(post.id)}>Send</button>
          </div>

          {comments[post.id]?.map((c, i) => (
            <p key={i} className="comment-text">💬 {c.text}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Posts;
