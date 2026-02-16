import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjcnTLmIcnPAFwpyTcRpK7sdmsLp4ycyc",
  authDomain: "asianlestaff.firebaseapp.com",
  projectId: "asianlestaff",
  storageBucket: "asianlestaff.firebasestorage.app",
  messagingSenderId: "510736376525",
  appId: "1:510736376525:web:628dce17d5cc4afe8a3f84",
  measurementId: "G-7478CR3VZF",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
export const auth = getAuth(app);
export const clientDb = getFirestore(app);
