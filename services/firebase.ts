
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { Movie, WebAppUser } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyBCD-bmsR1mDdmtEcRHDMg_kgJf5vF4EIo",
  authDomain: "media-hub-tma.firebaseapp.com",
  projectId: "media-hub-tma",
  storageBucket: "media-hub-tma.firebasestorage.app",
  messagingSenderId: "76351191530",
  appId: "1:76351191530:web:2a0c38a78d282fed6c9a93",
  measurementId: "G-935VR4CEGP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize or update user in Firestore based on Telegram ID
export const syncUser = async (user: WebAppUser) => {
  if (!user?.id) return;
  
  const userRef = doc(db, "users", user.id.toString());
  
  try {
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        profile: user,
        myList: [],
        likedMovies: [], 
        watchHistory: [], // Init history
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
    } else {
      // Update last active
      await updateDoc(userRef, {
        "profile.first_name": user.first_name,
        "profile.username": user.username,
        "profile.photo_url": user.photo_url,
        lastActive: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error syncing user:", error);
  }
};

// Toggle Movie in "My List"
export const toggleMyList = async (userId: number, movie: Movie, isInList: boolean) => {
  const userRef = doc(db, "users", userId.toString());
  try {
    if (isInList) {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const currentList = userSnap.data().myList || [];
          const updatedList = currentList.filter((m: Movie) => m.id !== movie.id);
          await updateDoc(userRef, { myList: updatedList });
      }
    } else {
      await updateDoc(userRef, {
        myList: arrayUnion(movie)
      });
    }
  } catch (error) {
    console.error("Error toggling list:", error);
  }
};

// Add to Watch History (Max 20 items, FIFO)
export const addToHistory = async (userId: number, movie: Movie) => {
    const userRef = doc(db, "users", userId.toString());
    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            let currentHistory = userSnap.data().watchHistory || [];
            
            // 1. Remove if already exists (to move it to top)
            currentHistory = currentHistory.filter((m: Movie) => m.id !== movie.id);
            
            // 2. Add to beginning
            currentHistory.unshift(movie);
            
            // 3. Keep only top 20
            if (currentHistory.length > 20) {
                currentHistory = currentHistory.slice(0, 20);
            }
            
            await updateDoc(userRef, { watchHistory: currentHistory });
        }
    } catch (error) {
        console.error("Error adding to history:", error);
    }
};

// Toggle Like
export const toggleLike = async (userId: number, movieId: string, isLiked: boolean) => {
  const userRef = doc(db, "users", userId.toString());
  try {
    await updateDoc(userRef, {
      likedMovies: isLiked ? arrayRemove(movieId) : arrayUnion(movieId)
    });
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};

// Real-time listener for User Data
export const subscribeToUserData = (userId: number, onUpdate: (data: any) => void) => {
  const userRef = doc(db, "users", userId.toString());
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data());
    }
  });
};
