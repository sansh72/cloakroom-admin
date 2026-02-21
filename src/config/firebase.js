import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBtdwmC51j-9GfIkSu3xOKPdBoof8vy19Q",
  authDomain: "ecom-c2aca.firebaseapp.com",
  projectId: "ecom-c2aca",
  storageBucket: "ecom-c2aca.firebasestorage.app",
  messagingSenderId: "93456296491",
  appId: "1:93456296491:web:7d3970e72435611e71186e",
  measurementId: "G-HN0M08ME62"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
