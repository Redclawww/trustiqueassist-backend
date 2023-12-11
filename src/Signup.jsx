import Home from "./Home";
import { useState } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { useEffect } from "react";
export const Signup = () => {
  const [value, setvalue] = useState("");
  const signInWithGoogle = () => {
    signInWithPopup(auth, provider).then((data) => {
      setvalue(data.user.email);
      localStorage.setItem("email", data.user.email);
    });
  };

  useEffect(() => {
    setvalue(localStorage.getItem("email"));
  }, []);

  return (
    <div>
      {value ? (
        <Home />
      ) : (
        <button onClick={signInWithGoogle}>Sign In with Google</button>
      )}
    </div>
  );
};
