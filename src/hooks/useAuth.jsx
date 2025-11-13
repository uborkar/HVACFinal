import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { ref, set, get } from 'firebase/database';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Create user profile in Realtime Database
  const createUserProfile = async (user, additionalData = {}) => {
    try {
      const userRef = ref(db, `users/${user.uid}/profile`);
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.displayName || '',
        photoURL: user.photoURL || additionalData.photoURL || '',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        ...additionalData
      };
      
      await set(userRef, userProfile);
      console.log('✅ User profile created in Realtime DB');
      return userProfile;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user) return;
    
    try {
      const userRef = ref(db, `users/${user.uid}/profile`);
      await set(userRef, {
        ...updates,
        lastUpdated: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
    }
  };

  // Get user profile
  const getUserProfile = async (userId) => {
    try {
      const userRef = ref(db, `users/${userId}/profile`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      try {
        setLoading(true);
        setAuthError(null);

        if (userAuth) {
          // User is signed in
          console.log('✅ User authenticated:', userAuth.uid);
          
          // Get or create user profile
          let userProfile = await getUserProfile(userAuth.uid);
          
          if (!userProfile) {
            // Create profile for existing users who don't have one
            userProfile = await createUserProfile(userAuth);
          } else {
            // Update last login
            await updateUserProfile({ lastLogin: Date.now() });
          }

          setUser({
            uid: userAuth.uid,
            email: userAuth.email,
            displayName: userAuth.displayName,
            photoURL: userAuth.photoURL,
            profile: userProfile
          });
        } else {
          // User is signed out
          console.log('✅ User signed out');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        setAuthError(error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setAuthError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('❌ Login error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName = '') => {
    try {
      setAuthError(null);
      setLoading(true);
      
      // Create user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile in Auth
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      // Create user profile in Realtime DB
      await createUserProfile(result.user, { displayName });
      
      return result;
    } catch (error) {
      console.error('❌ Registration error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('❌ Logout error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Use popup instead of redirect for better control
      const result = await signInWithPopup(auth, provider);
      
      // Create/update user profile
      await createUserProfile(result.user);
      
      return result;
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    user, 
    loading, 
    error: authError,
    login, 
    register, 
    logout, 
    signInWithGoogle,
    updateUserProfile,
    getUserProfile
  };
};