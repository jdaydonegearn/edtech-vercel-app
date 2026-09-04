import { 
  collection, 
  getDocs, 
  getDocFromServer, 
  doc, 
  DocumentData,
  Timestamp 
} from 'firebase/firestore';
import { db, IS_FIREBASE_CONNECTED } from './firebase';
import firebaseConfigJson from '../../firebase-applet-config.json';

export interface FieldSchemaInfo {
  fieldName: string;
  inferredType: string;
  sampleValue: string;
  isOptional: boolean;
}

export interface CollectionDiagnosticResult {
  collectionName: string;
  count: number;
  schema: Record<string, string>;
  fieldsList: FieldSchemaInfo[];
  sampleDocument: Record<string, any> | null;
  error?: string;
}

export interface DiagnosticSummary {
  connected: boolean;
  databaseId: string;
  projectId: string;
  timestamp: string;
  pingServerLatencyMs?: number;
  collections: {
    equipment: CollectionDiagnosticResult;
    history: CollectionDiagnosticResult;
    archivedBorrowRequests?: CollectionDiagnosticResult;
    borrowRequests?: CollectionDiagnosticResult;
  };
}

/**
 * Infer human-readable data type from a Firestore field value
 */
function inferType(val: any): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'array (empty)';
    const firstType = inferType(val[0]);
    return `array<${firstType}>`;
  }
  if (val instanceof Timestamp || (typeof val === 'object' && typeof val.toDate === 'function')) {
    return 'Timestamp';
  }
  if (typeof val === 'object') {
    return 'object';
  }
  return typeof val;
}

/**
 * Format sample value for table display
 */
function formatSample(val: any): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'string') {
    return val.length > 50 ? `${val.slice(0, 47)}...` : val;
  }
  if (typeof val === 'object') {
    if (val instanceof Timestamp || typeof val.toDate === 'function') {
      try {
        return val.toDate().toISOString();
      } catch {
        return '[Timestamp]';
      }
    }
    const str = JSON.stringify(val);
    return str.length > 50 ? `${str.slice(0, 47)}...` : str;
  }
  return String(val);
}

/**
 * Inspect a specific Firestore collection and extract schema + counts
 */
async function inspectCollection(collectionName: string): Promise<CollectionDiagnosticResult> {
  if (!db) {
    return {
      collectionName,
      count: 0,
      schema: {},
      fieldsList: [],
      sampleDocument: null,
      error: 'Firestore instance is not initialized'
    };
  }

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const count = snapshot.size;

    if (count === 0) {
      return {
        collectionName,
        count: 0,
        schema: {},
        fieldsList: [],
        sampleDocument: null
      };
    }

    // Accumulate all fields across documents to get complete schema
    const fieldFrequency = new Map<string, number>();
    const fieldTypes = new Map<string, Set<string>>();
    const fieldSamples = new Map<string, any>();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as DocumentData;
      Object.entries(data).forEach(([key, val]) => {
        fieldFrequency.set(key, (fieldFrequency.get(key) || 0) + 1);
        if (!fieldTypes.has(key)) {
          fieldTypes.set(key, new Set());
        }
        fieldTypes.get(key)!.add(inferType(val));

        if (!fieldSamples.has(key) && val !== null && val !== undefined) {
          fieldSamples.set(key, val);
        }
      });
    });

    const schema: Record<string, string> = {};
    const fieldsList: FieldSchemaInfo[] = [];

    fieldTypes.forEach((typesSet, key) => {
      const typeStr = Array.from(typesSet).join(' | ');
      schema[key] = typeStr;
      fieldsList.push({
        fieldName: key,
        inferredType: typeStr,
        sampleValue: formatSample(fieldSamples.get(key)),
        isOptional: (fieldFrequency.get(key) || 0) < count
      });
    });

    // Sort fields alphabetically
    fieldsList.sort((a, b) => a.fieldName.localeCompare(b.fieldName));

    const sampleDoc = snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;

    return {
      collectionName,
      count,
      schema,
      fieldsList,
      sampleDocument: sampleDoc
    };
  } catch (err: any) {
    return {
      collectionName,
      count: 0,
      schema: {},
      fieldsList: [],
      sampleDocument: null,
      error: err?.message || String(err)
    };
  }
}

/**
 * Diagnostic utility function to verify connection to Firestore
 * and log the actual schema and document counts for 'equipment' and 'history' collections.
 */
export async function runFirestoreDiagnostics(): Promise<DiagnosticSummary> {
  const databaseId = firebaseConfigJson.firestoreDatabaseId || 'ai-studio-edtechequipmentb-88754315-f822-4cec-aa75-4edd33935c93';
  const projectId = firebaseConfigJson.projectId || 'edtechstock';
  const timestamp = new Date().toISOString();

  console.group(`🔍 [Firestore Diagnostics] Checking Connection & Collections — ${timestamp}`);
  console.info(`📌 Project ID: %c${projectId}%c | Database ID: %c${databaseId}`, 'font-weight:bold;color:#3b82f6', '', 'font-weight:bold;color:#10b981', '');

  // 1. Connection Ping Test
  let connected = false;
  let latencyMs = 0;
  if (!IS_FIREBASE_CONNECTED || !db) {
    console.error('❌ Firestore connection failed: db instance is null or IS_FIREBASE_CONNECTED is false');
  } else {
    try {
      const start = performance.now();
      // Test direct roundtrip to Firestore server
      try {
        await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      } catch (pingErr: any) {
        // Even if the ping document doesn't exist, if error is not network/offline, connection reached server
        if (pingErr?.message && pingErr.message.includes('the client is offline')) {
          throw pingErr;
        }
      }
      latencyMs = Math.round(performance.now() - start);
      connected = true;
      console.log(`✅ %cFirestore Server Connected%c (${latencyMs} ms)`, 'color:#10b981;font-weight:bold', '');
    } catch (err: any) {
      console.error('❌ Firestore Connection Ping Error:', err?.message || err);
      connected = false;
    }
  }

  // 2. Query 'equipment' collection
  const equipmentRes = await inspectCollection('equipment');
  console.group(`📦 Collection: 'equipment' (Documents: ${equipmentRes.count})`);
  if (equipmentRes.error) {
    console.error(`⚠️ Error fetching 'equipment': ${equipmentRes.error}`);
  } else if (equipmentRes.count === 0) {
    console.warn(`⚠️ Collection 'equipment' is empty (0 documents).`);
  } else {
    console.log(`✅ Found ${equipmentRes.count} documents in 'equipment'. Schema details:`);
    console.table(equipmentRes.fieldsList.map(f => ({
      Field: f.fieldName,
      Type: f.inferredType,
      Optional: f.isOptional ? 'Yes' : 'No',
      Sample: f.sampleValue
    })));
    console.log('Sample Document:', equipmentRes.sampleDocument);
  }
  console.groupEnd();

  // 3. Query 'history' collection
  const historyRes = await inspectCollection('history');
  console.group(`📜 Collection: 'history' (Documents: ${historyRes.count})`);
  if (historyRes.error) {
    console.error(`⚠️ Error fetching 'history': ${historyRes.error}`);
  } else if (historyRes.count === 0) {
    console.info(`ℹ️ Collection 'history' contains 0 documents (or app may store history in 'archived_borrow_requests').`);
  } else {
    console.log(`✅ Found ${historyRes.count} documents in 'history'. Schema details:`);
    console.table(historyRes.fieldsList.map(f => ({
      Field: f.fieldName,
      Type: f.inferredType,
      Optional: f.isOptional ? 'Yes' : 'No',
      Sample: f.sampleValue
    })));
    console.log('Sample Document:', historyRes.sampleDocument);
  }
  console.groupEnd();

  // 4. Also inspect related history collections in this system for comprehensive verification
  const archivedRes = await inspectCollection('archived_borrow_requests');
  const borrowReqRes = await inspectCollection('borrow_requests');

  console.groupCollapsed(`📑 Related System Collections ('borrow_requests' & 'archived_borrow_requests')`);
  console.log(`- 'borrow_requests': ${borrowReqRes.count} documents`);
  if (borrowReqRes.fieldsList.length > 0) {
    console.table(borrowReqRes.fieldsList.slice(0, 10).map(f => ({
      Field: f.fieldName,
      Type: f.inferredType,
      Sample: f.sampleValue
    })));
  }
  console.log(`- 'archived_borrow_requests': ${archivedRes.count} documents`);
  if (archivedRes.fieldsList.length > 0) {
    console.table(archivedRes.fieldsList.slice(0, 10).map(f => ({
      Field: f.fieldName,
      Type: f.inferredType,
      Sample: f.sampleValue
    })));
  }
  console.groupEnd();

  console.groupEnd();

  const summary: DiagnosticSummary = {
    connected,
    databaseId,
    projectId,
    timestamp,
    pingServerLatencyMs: latencyMs,
    collections: {
      equipment: equipmentRes,
      history: historyRes,
      borrowRequests: borrowReqRes,
      archivedBorrowRequests: archivedRes
    }
  };

  return summary;
}

// Attach globally to window for interactive browser DevTools console inspection
if (typeof window !== 'undefined') {
  (window as any).runFirestoreDiagnostics = runFirestoreDiagnostics;
  (window as any).verifyFirestoreConnection = runFirestoreDiagnostics;
}
