import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Logout() {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <button className="logout-btn" onClick={handleLogout}>
      Logout
    </button>
  );
}

export default Logout;
