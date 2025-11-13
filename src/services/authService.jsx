import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../firebase/config';

export const authService = {
  login: (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  register: (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  logout: () => {
    return signOut(auth);
  }
};