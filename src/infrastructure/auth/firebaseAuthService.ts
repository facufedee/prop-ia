import { auth } from "@/infrastructure/firebase/client";
import {
GoogleAuthProvider,
signInWithPopup,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
} from "firebase/auth";


export const loginWithGoogle = () => {
const provider = new GoogleAuthProvider();
return signInWithPopup(auth, provider);
};


export const registerEmail = (email: string, pass: string) =>
createUserWithEmailAndPassword(auth, email, pass);


export const loginEmail = (email: string, pass: string) =>
signInWithEmailAndPassword(auth, email, pass);


export const logoutUser = () => signOut(auth);