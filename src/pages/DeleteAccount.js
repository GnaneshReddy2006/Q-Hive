import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";

import {
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  doc
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { toast } from "react-toastify";

function DeleteAccount() {
  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm("⚠️ This will permanently delete your account.")) return;

    try {
      const password = prompt("Enter your password to confirm:");
      if (!password) return;

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      const userId = user.uid;

      const collections = ["posts", "comments", "likes"];
      for (const col of collections) {
        const snap = await getDocs(
          query(collection(db, col), where("userId", "==", userId))
        );
        for (const d of snap.docs) {
          await deleteDoc(doc(db, col, d.id));
        }
      }

      await deleteDoc(doc(db, "users", userId));

      await deleteUser(user);

      toast.success("Account deleted successfully");
      window.location.href = "/signup";

    } catch (err) {
      console.error(err);
      toast.error("Account deletion failed");
    }
  };

  return (
    <button className="delete-account-btn" onClick={handleDelete}>
      Delete Account
    </button>
  );
}

export default DeleteAccount;
