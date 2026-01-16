import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const handleSignup = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const name = document.getElementById("name").value;
    const year = Number(document.getElementById("year").value);
    const branch = document.getElementById("branch").value;

    const emailPattern = /^[0-9]{3}g[0-9]a[0-9]{4}@srit\.ac\.in$/;

    if (!emailPattern.test(email)) {
      alert("Only SRIT college email allowed");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        name,
        year,
        branch,
        createdAt: serverTimestamp()
      });

      alert("Signup successful 🎉");

      // 🔥 Redirect user to CreatePost page
      navigate("/create");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Signup</h2>

        <input id="name" placeholder="Name" />
        <input id="email" placeholder="College Email" />
        <input id="password" type="password" placeholder="Password" />
        <input id="year" placeholder="Year" />
        <input id="branch" placeholder="Branch" />

        <button onClick={handleSignup}>Signup</button>
      </div>
    </div>
  );
}

export default Signup;
