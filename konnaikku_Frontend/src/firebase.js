import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCa4pKA4EgpW-GORGaIRwZyiv6ifjuePks",
  authDomain: "webapp-cp422021-g14project.firebaseapp.com",
  databaseURL: "https://webapp-cp422021-g14project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "webapp-cp422021-g14project",
  storageBucket: "webapp-cp422021-g14project.firebasestorage.app",
  messagingSenderId: "223251237303",
  appId: "1:223251237303:web:c0b60f857e75677ca14032",
  measurementId: "G-V8BT0JH4B4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };