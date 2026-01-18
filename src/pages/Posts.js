/* eslint-disable no-unused-vars */
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { supabase } from "../supabase";
import { toast } from "react-toastify";

function Posts() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [textPreview, setTextPreview] = useState({});

  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  /* LOAD TEXT FILE */
  const loadTextFile = async (postId, fileUrl) => {
    try {
      const res = await fetch(fileUrl);
      const text = await res.text();

      setTextPreview((p) => ({
        ...p,
        [postId]: text
      }));
    } catch {
      toast.error("Failed to load text file ❌");
    }
  };

  /* LIKE SYSTEM — FIXED */
  const toggleLike = async (postId, currentLikes = []) => {
    if (!user) return toast.error("Login required");

    const postRef = doc(db, "posts", postId);
    const userId = user.uid;

    const hasLiked = currentLikes.includes(userId);
    const updatedLikes = hasLiked
      ? currentLikes.filter((id) => id !== userId)
      : [...currentLikes, userId];

    await updateDoc(postRef, { likes: updatedLikes });

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: updatedLikes } : post
      )
    );
    setFilteredPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: updatedLikes } : post
      )
    );
  };

  /* COMMENTS */
  const fetchComments = async (postId) => {
    const snap = await getDocs(
      query(collection(db, "comments"), where("postId", "==", postId))
    );

    setComments((p) => ({
      ...p,
      [postId]: snap.docs.map((d) => d.data())
    }));
  };

  const addComment = async (postId) => {
    if (!user || !newComment[postId]?.trim()) return;

    await addDoc(collection(db, "comments"), {
      postId,
      userId: user.uid,
      text: newComment[postId],
      createdAt: new Date()
    });

    setNewComment((p) => ({ ...p, [postId]: "" }));
    fetchComments(postId);
  };

  /* LOAD POSTS */
  const fetchAllPosts = useCallback(async () => {
    const snap = await getDocs(collection(db, "posts"));
    const list = [];

    for (const d of snap.docs) {
      const post = { id: d.id, ...d.data() };

      if (!Array.isArray(post.likes)) post.likes = []; // FIX

      if (post.userId) {
        const uSnap = await getDoc(doc(db, "users", post.userId));
        const u = uSnap.exists() ? uSnap.data() : {};
        post.userBranch = u.branch || "N/A";
        post.userYear = u.year || "N/A";
      }

      list.push(post);
      fetchComments(post.id);
    }

    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    setPosts(list);
    setFilteredPosts(list);
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  /* FILTER */
  useEffect(() => {
    let u = [...posts];

    if (branchFilter !== "All")
      u = u.filter((p) => p.userBranch === branchFilter);

    if (yearFilter !== "All")
      u = u.filter((p) => String(p.userYear) === yearFilter);

    if (searchText)
      u = u.filter(
        (p) =>
          p.title.toLowerCase().includes(searchText.toLowerCase()) ||
          p.description.toLowerCase().includes(searchText.toLowerCase())
      );

    setFilteredPosts(u);
  }, [branchFilter, yearFilter, searchText, posts]);

  /* DELETE */
  const deletePost = async (postId, fileUrl) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      if (fileUrl) {
        const name = fileUrl.split("/").pop();
        await supabase.storage.from("documents").remove([name]);
      }

      await deleteDoc(doc(db, "posts", postId));

      setPosts((p) => p.filter((x) => x.id !== postId));
      setFilteredPosts((p) => p.filter((x) => x.id !== postId));

      toast.success("Post deleted ✔️");
    } catch {
      toast.error("Delete failed ❌");
    }
  };

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
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* POSTS */}
      {filteredPosts.map((post) => (
        <div className="post-card" key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
          <p>
            <strong>{post.userBranch}</strong> | Year {post.userYear}
          </p>

          {/* IMAGE */}
          {post.fileType?.startsWith("image") && <img src={post.fileUrl} alt="" />}

          {/* VIDEO */}
          {post.fileType?.startsWith("video") && (
            <div className="video-wrapper">
              <video src={post.fileUrl} controls preload="metadata" />
            </div>
          )}

          {/* PDF */}
          {post.fileType === "application/pdf" && (
            <div>
              <a href={post.fileUrl} target="_blank" rel="noreferrer">
                📄 View PDF
              </a>
              <br />
              <a href={post.fileUrl} download>
                ⬇️ Download PDF
              </a>
            </div>
          )}

          {/* TXT FILE */}
          {post.fileType === "text/plain" && (
            <>
              <button onClick={() => loadTextFile(post.id, post.fileUrl)}>📃 View Text</button>
              <a href={post.fileUrl} download>⬇️ Download TXT</a>

              {textPreview[post.id] && (
                <pre className="text-preview-box">{textPreview[post.id]}</pre>
              )}
            </>
          )}

          {/* OTHER FILE TYPES */}
          {!post.fileType?.startsWith("image") &&
            !post.fileType?.startsWith("video") &&
            post.fileType !== "application/pdf" &&
            post.fileType !== "text/plain" &&
            post.fileUrl && <a href={post.fileUrl} download>⬇️ Download File</a>}

          {/* LIKE BUTTON */}
          <button
            className="like-button"
            onClick={() => toggleLike(post.id, post.likes)}
          >
            ❤️ {post.likes?.length || 0}
          </button>

          {/* DELETE ONLY BY OWNER */}
          {user?.uid === post.userId && (
            <button className="delete-btn" onClick={() => deletePost(post.id, post.fileUrl)}>
              Delete
            </button>
          )}

          {/* COMMENTS */}
          <div className="comment-box">
            <input
              placeholder="comment.."
              value={newComment[post.id] || ""}
              onChange={(e) =>
                setNewComment((p) => ({ ...p, [post.id]: e.target.value }))
              }
            />
            <button onClick={() => addComment(post.id)}>Send</button>
          </div>

          {comments[post.id]?.map((c, i) => (
            <p key={i}>💬 {c.text}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Posts;
