import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Staff, StaffCommittee } from '../types';

// Silence unreachable/offline logs so that temporary offline transitions don't throw noisy errors in the console
try {
  setLogLevel('silent');
} catch {
  // Ignore in case of unsupported environment
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Initialize Firestore using the designated firestoreDatabaseId from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Standard Error Handling conforming to Firebase Integration Skill
 */
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  return errInfo;
}

/**
 * Test Connection helper as specified in Firebase Integration Skill
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // Normal offline state; continue gracefully
    }
    return false;
  }
}

// Resilient promise timeout helper to avoid hanging on slow backend
const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 4000): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore operation timeout')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Save staff list to Firebase Firestore (Server proxy + Client SDK)
 */
export const saveStaffListToFirestore = async (staffList: Staff[]): Promise<boolean> => {
  let saved = false;

  // 1. Try server proxy endpoint first (fast, reliable server-to-server connection)
  try {
    const res = await fetch('/api/firestore/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffList }),
    });
    if (res.ok) {
      saved = true;
    }
  } catch {
    // Fall back to direct client SDK below
  }

  // 2. Direct client SDK write (best effort)
  try {
    const summaryRef = doc(db, 'system', 'staff_data');
    await runWithTimeout(
      setDoc(summaryRef, {
        updatedAt: new Date().toISOString(),
        count: staffList.length,
        data: staffList,
      }),
      4000
    );
    saved = true;

    // Background individual records sync
    (async () => {
      try {
        const chunkSize = 400;
        for (let i = 0; i < staffList.length; i += chunkSize) {
          const chunk = staffList.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach((s) => {
            const rawId = s.ID || s.staff_id || `ST_${Math.random().toString(36).substring(2, 8)}`;
            const docId = rawId.toUpperCase().trim().replace(/[\/\s]/g, '_');
            const staffRef = doc(db, 'staff', docId);
            batch.set(staffRef, s, { merge: true });
          });
          await batch.commit();
        }
      } catch {
        // Silently handled
      }
    })();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/staff_data');
  }

  return saved;
};

/**
 * Fetch staff list from Firebase Firestore (Server proxy + Client SDK fallback)
 */
export const fetchStaffListFromFirestore = async (): Promise<Staff[]> => {
  // 1. Try fast server-side Firestore proxy endpoint
  try {
    const res = await runWithTimeout(fetch('/api/firestore/staff'), 3000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as Staff[];
      }
    }
  } catch {
    // Fall back to client SDK
  }

  // 2. Client SDK query
  try {
    const docSnap = await runWithTimeout(getDocs(collection(db, 'system')), 3000);
    let foundData: Staff[] = [];
    docSnap.forEach((d) => {
      if (d.id === 'staff_data' && d.data()?.data) {
        foundData = d.data().data;
      }
    });

    if (foundData.length > 0) {
      return foundData;
    }

    const querySnapshot = await runWithTimeout(getDocs(collection(db, 'staff')), 3000);
    const staff: Staff[] = [];
    querySnapshot.forEach((docItem) => {
      staff.push(docItem.data() as Staff);
    });
    return staff;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'staff');
    return [];
  }
};

/**
 * Save committee list to Firebase Firestore
 */
export const saveCommitteesToFirestore = async (committeesList: StaffCommittee[]): Promise<boolean> => {
  let saved = false;

  // 1. Try server proxy endpoint
  try {
    const res = await fetch('/api/firestore/committees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ committeesList }),
    });
    if (res.ok) {
      saved = true;
    }
  } catch {
    // Fall back to client SDK
  }

  // 2. Client SDK write
  try {
    const summaryRef = doc(db, 'system', 'committee_data');
    await runWithTimeout(
      setDoc(summaryRef, {
        updatedAt: new Date().toISOString(),
        count: committeesList.length,
        data: committeesList,
      }),
      4000
    );
    saved = true;

    // Background individual committee records sync
    (async () => {
      try {
        const chunkSize = 400;
        for (let i = 0; i < committeesList.length; i += chunkSize) {
          const chunk = committeesList.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach((c, idx) => {
            const rawId = c.id || `c-${c.staff_id || 'st'}-${i + idx}`;
            const docId = rawId.replace(/[\/\s]/g, '_');
            const commRef = doc(db, 'committees', docId);
            batch.set(commRef, c, { merge: true });
          });
          await batch.commit();
        }
      } catch {
        // Silently handled
      }
    })();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/committee_data');
  }

  return saved;
};

/**
 * Fetch committee list from Firebase Firestore
 */
export const fetchCommitteesFromFirestore = async (): Promise<StaffCommittee[]> => {
  // 1. Try fast server proxy endpoint
  try {
    const res = await runWithTimeout(fetch('/api/firestore/committees'), 3000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as StaffCommittee[];
      }
    }
  } catch {
    // Fall back to client SDK
  }

  // 2. Client SDK query
  try {
    const docSnap = await runWithTimeout(getDocs(collection(db, 'system')), 3000);
    let foundData: StaffCommittee[] = [];
    docSnap.forEach((d) => {
      if (d.id === 'committee_data' && d.data()?.data) {
        foundData = d.data().data;
      }
    });

    if (foundData.length > 0) {
      return foundData;
    }

    const querySnapshot = await runWithTimeout(getDocs(collection(db, 'committees')), 3000);
    const committees: StaffCommittee[] = [];
    querySnapshot.forEach((docItem) => {
      committees.push(docItem.data() as StaffCommittee);
    });
    return committees;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'committees');
    return [];
  }
};
