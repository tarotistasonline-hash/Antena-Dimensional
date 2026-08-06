import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';

let firebaseConfig: any = {
  apiKey: "AIzaSyDemoPlaceholderKey123456789",
  authDomain: "antena-dimensional.firebaseapp.com",
  projectId: "antena-dimensional",
  storageBucket: "antena-dimensional.appspot.com",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:1234567890"
};

// Intento de carga dinámica de la configuración si existe
try {
  const loadedConfig = (import.meta as any).glob('../firebase-applet-config.json', { eager: true });
  const key = Object.keys(loadedConfig)[0];
  if (key && loadedConfig[key] && loadedConfig[key].default) {
    firebaseConfig = loadedConfig[key].default;
  }
} catch (e) {
  console.warn("Utilizando configuración local de respaldo para Firebase.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scopes for Google Sheets and Google Drive (creating file)
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener and check for redirect result
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if returning from a redirect auth flow
  getRedirectResult(auth).then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        if (onAuthSuccess) onAuthSuccess(result.user, credential.accessToken);
      }
    }
  }).catch((err) => {
    console.warn("Error en el resultado del redireccionamiento:", err);
  });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with popup, fallback to redirect if popup is blocked
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      console.warn("Pop-up falló o fue bloqueado, intentando redirección:", popupErr);
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/popup-closed-by-user' || popupErr.message?.includes('popup')) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupErr;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se obtuvo el token de acceso de Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

