
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  writeBatch,
  getDocs
} from "firebase/firestore";
import { Movie, WebAppUser, AppNotification } from "../types";

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
        dislikedMovies: [], // Init dislikes
        watchHistory: [], 
        isBanned: false, // Default ban status
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
      // Send welcome notification
      await sendPersonalNotification(user.id, "Welcome to Media Hub!", "Explore the best movies and TV shows.", "system");
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
            currentHistory = currentHistory.filter((m: Movie) => m.id !== movie.id);
            currentHistory.unshift(movie);
            if (currentHistory.length > 20) {
                currentHistory = currentHistory.slice(0, 20);
            }
            await updateDoc(userRef, { watchHistory: currentHistory });
        }
    } catch (error) {
        console.error("Error adding to history:", error);
    }
};

export const toggleLike = async (userId: number, movieId: string, isLiked: boolean) => {
  const userRef = doc(db, "users", userId.toString());
  try {
    if (isLiked) {
        await updateDoc(userRef, { likedMovies: arrayRemove(movieId) });
    } else {
        await updateDoc(userRef, {
            likedMovies: arrayUnion(movieId),
            dislikedMovies: arrayRemove(movieId)
        });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};

export const toggleDislike = async (userId: number, movieId: string, isDisliked: boolean) => {
  const userRef = doc(db, "users", userId.toString());
  try {
    if (isDisliked) {
        await updateDoc(userRef, { dislikedMovies: arrayRemove(movieId) });
    } else {
        await updateDoc(userRef, {
            dislikedMovies: arrayUnion(movieId),
            likedMovies: arrayRemove(movieId)
        });
    }
  } catch (error) {
    console.error("Error toggling dislike:", error);
  }
};

export const subscribeToUserData = (userId: number, onUpdate: (data: any) => void) => {
  const userRef = doc(db, "users", userId.toString());
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data());
    }
  });
};

// --- USER MANAGEMENT (ADMIN) ---

// 1. Fetch All Users (Limited to last 50 active for performance)
export const getAllUsers = async (): Promise<any[]> => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("lastActive", "desc"), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

// 2. Ban/Unban User
export const toggleUserBan = async (userId: string, isBanned: boolean) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { isBanned: !isBanned });
    } catch (error) {
        console.error("Error toggling ban:", error);
    }
};

// 3. Real-time Listener for Ban Status (For the App)
export const subscribeToUserBanStatus = (userId: number, onStatusChange: (isBanned: boolean) => void) => {
    const userRef = doc(db, "users", userId.toString());
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            // If field doesn't exist, default to false
            const banned = doc.data().isBanned === true; 
            onStatusChange(banned);
        }
    });
};


// --- NOTIFICATIONS SYSTEM ---

// Helper: Clean up old notifications (Max 5 items, Max 5 days old)
const cleanUpNotifications = async (userId: number, notifications: AppNotification[]) => {
    if (!notifications || notifications.length === 0) return;

    const MAX_ITEMS = 5;
    const MAX_DAYS = 5;
    const now = new Date();
    const batch = writeBatch(db);
    let hasChanges = false;

    // 1. Identify Expired Items
    const validTime = now.getTime() - (MAX_DAYS * 24 * 60 * 60 * 1000);
    const expiredIds = notifications
        .filter(n => new Date(n.date).getTime() < validTime)
        .map(n => n.id);

    // 2. Identify Excess Items (FIFO - delete oldest)
    // We assume 'notifications' is already sorted by date desc from the query
    const excessIds: string[] = [];
    if (notifications.length > MAX_ITEMS) {
        // Take everything after index 4 (the 6th item onwards)
        const itemsToRemove = notifications.slice(MAX_ITEMS);
        itemsToRemove.forEach(n => excessIds.push(n.id));
    }

    const idsToDelete = new Set([...expiredIds, ...excessIds]);

    idsToDelete.forEach(id => {
        // Only delete real docs (not admin/global ones handled locally)
        // Check if ID looks like a firestore ID (usually 20 chars)
        if (id && id.length > 5) {
             const ref = doc(db, "users", userId.toString(), "notifications", id);
             batch.delete(ref);
             hasChanges = true;
        }
    });

    if (hasChanges) {
        try {
            await batch.commit();
            console.log("Cleanup: Deleted old notifications");
        } catch (e) {
            console.error("Cleanup failed", e);
        }
    }
};

// 1. Send Personal Notification
export const sendPersonalNotification = async (
    userId: number, 
    title: string, 
    message: string, 
    type: 'system' | 'reminder' | 'admin' = 'system',
    movie?: Movie,
    customDate?: string // Optional parameter to schedule for future
) => {
    try {
        const notifsRef = collection(db, "users", userId.toString(), "notifications");
        await addDoc(notifsRef, {
            title,
            message,
            // If customDate is provided (e.g., release date), use it. Otherwise use now.
            date: customDate ? new Date(customDate).toISOString() : new Date().toISOString(),
            type,
            isRead: false,
            movieId: movie?.id || null,
            posterUrl: movie?.posterUrl || null
        });
    } catch (e) {
        console.error("Failed to send personal notification", e);
    }
};

// 2. Send Global Notification
export const sendGlobalNotification = async (title: string, message: string) => {
    try {
        const globalRef = collection(db, "global_notifications");
        await addDoc(globalRef, {
            title,
            message,
            date: new Date().toISOString(),
            type: 'admin'
        });
    } catch (e) {
        console.error("Failed to send global notification", e);
    }
};

// 3. Subscribe to Personal Notifications with Auto-Cleanup
export const subscribeToPersonalNotifications = (userId: number, onUpdate: (notifs: AppNotification[]) => void) => {
    const notifsRef = collection(db, "users", userId.toString(), "notifications");
    // Limit to 20 initially to check for overflow, then we cleanup down to 5
    const q = query(notifsRef, orderBy("date", "desc"), limit(20)); 
    
    return onSnapshot(q, (snapshot) => {
        const notifs: AppNotification[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AppNotification));
        
        // Trigger cleanup in background
        cleanUpNotifications(userId, notifs);

        // Return current state (UI will update automatically when delete happens and snapshot fires again)
        onUpdate(notifs);
    });
};

// 4. Subscribe to Global Notifications
export const subscribeToGlobalNotifications = (onUpdate: (notifs: AppNotification[]) => void) => {
    const globalRef = collection(db, "global_notifications");
    // Only fetch last 5 globals to keep it light
    const q = query(globalRef, orderBy("date", "desc"), limit(5));

    return onSnapshot(q, (snapshot) => {
        const notifs: AppNotification[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isRead: false 
        } as AppNotification));
        onUpdate(notifs);
    });
};

// 5. Mark as Read (Personal)
export const markNotificationRead = async (userId: number, notifId: string) => {
    try {
        const ref = doc(db, "users", userId.toString(), "notifications", notifId);
        await updateDoc(ref, { isRead: true });
    } catch (e) {
        console.error("Error marking read", e);
    }
};

// 6. Delete Personal Notification
export const deletePersonalNotification = async (userId: number, notifId: string) => {
    try {
        const ref = doc(db, "users", userId.toString(), "notifications", notifId);
        await deleteDoc(ref);
    } catch (e) {
        console.error("Error deleting notification", e);
    }
};
