import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

const loadedConfigModules = (import.meta as any).glob('../firebase-applet-config.json', { eager: true }) as Record<
  string,
  { default?: FirebaseAppletConfig }
>;
const configKey = Object.keys(loadedConfigModules)[0];
const loadedConfig = configKey ? loadedConfigModules[configKey]?.default : undefined;

export const isFirebaseConfigured = Boolean(loadedConfig && loadedConfig.projectId && loadedConfig.apiKey);

const firebaseConfig: FirebaseAppletConfig = loadedConfig || {
  apiKey: 'unconfigured',
  authDomain: 'unconfigured.firebaseapp.com',
  projectId: 'unconfigured',
  appId: '1:000000000000:web:000000000000',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export { firebaseConfig };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Notice / Offline: ', JSON.stringify(errInfo));
  const errStr = errInfo.error.toLowerCase();
  if (errStr.includes('offline') || errStr.includes('unavailable') || errStr.includes('network')) {
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const workspaceProvider = new GoogleAuthProvider();
// Request Workspace scopes for Google Sheets and Google Drive (creating file)
workspaceProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
workspaceProvider.addScope('https://www.googleapis.com/auth/drive.file');

const basicGoogleProvider = new GoogleAuthProvider();

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const ADMIN_EMAIL = 'tarotistasonline@gmail.com';

export const isFirebaseAdminUser = (user: User | null): boolean => {
  return Boolean(user && user.email === ADMIN_EMAIL && user.emailVerified === true);
};

export const subscribeToAuthUser = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign in using Firebase Google Auth (for operator database calibration/moderation)
export const signInFirebaseAdmin = async (): Promise<User | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, basicGoogleProvider);
    return result.user;
  } catch (error) {
    console.error('Error al autenticar administrador en Firebase:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Initialize auth state listener and check for redirect result (Workspace OAuth for Sheets)
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          if (onAuthSuccess) onAuthSuccess(result.user, credential.accessToken);
        }
      }
    })
    .catch((err) => {
      console.warn('Error en el resultado del redireccionamiento:', err);
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

// Google Sign-In with popup, fallback to redirect if popup is blocked (Workspace OAuth for Sheets)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    let result;
    try {
      result = await signInWithPopup(auth, workspaceProvider);
    } catch (popupErr: any) {
      console.warn('Pop-up falló o fue bloqueado, intentando redirección:', popupErr);
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.message?.includes('popup')
      ) {
        await signInWithRedirect(auth, workspaceProvider);
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
