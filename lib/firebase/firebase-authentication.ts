import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    deleteUser
  } from "firebase/auth";
  import { User } from "firebase/auth";
  
  import { auth } from "./firebase";
  
    
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
  
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
  
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  
    if (!response.ok) {
      throw new Error('Login failed');
    }
  
    return result.user;
  };
  
  const logInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
  
    await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });
  };
  
  const signUpWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idToken = await userCredential.user.getIdToken();

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup API failed");
    }

    return userCredential;
  };

  const logOut = async () => {
    await fetch('/api/logout', {
      method: 'POST',
    });
  };
  
  export const deleteAuthenticatedUser = async (user: User): Promise<void> => {
    try {
        await deleteUser(user);
    } catch (error) {
        console.error("Error deleting user:", error);
    }
  };
  
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent!");
    } catch (err) {
      console.error(err);
    }
  };
  
  const isLoggedIn = async (): Promise<boolean> => {
    try {
      await new Promise((resolve, reject) =>
        auth.onAuthStateChanged(
          (user) => {
            if (user) {
              // User is signed in.
              resolve(user);
            } else {
              // No user is signed in.
              reject("no user logged in");
            }
          },
          // Prevent console error
          (error) => reject(error)
        )
      );
      return true;
    } catch (error) {
      console.log("Error on isLoggedIn()", error);
      return false;
    }
  };
  
  
  export {
    signInWithGoogle,
    logInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    sendPasswordReset,
    logOut,
    isLoggedIn,
  };