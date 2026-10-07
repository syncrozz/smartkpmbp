import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize server-side Firebase instance
const serverFirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig, 'kpmbp-backend') : getApps()[0];
const serverDb = getFirestore(serverFirebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser for JSON
  app.use(express.json({ limit: '25mb' }));

  // CORS headers middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Helper functions for parsing Google Spreadsheet data as fallbacks
  function parseGvizResponse(gvizText: string) {
    const match = gvizText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
    if (!match) return null;
    try {
      const json = JSON.parse(match[1]);
      if (!json.table || !json.table.cols || !json.table.rows) return null;
      const headers = json.table.cols.map((col: any, i: number) => (col.label || col.id || `col_${i}`).trim());
      const rows = json.table.rows.map((row: any) => {
        const obj: Record<string, any> = {};
        row.c.forEach((cell: any, i: number) => {
          const key = headers[i];
          if (key) {
            obj[key] = cell && cell.v !== undefined && cell.v !== null ? cell.v : '';
          }
        });
        return obj;
      });
      return rows;
    } catch {
      return null;
    }
  }

  function parseCSV(csvText: string) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return null;
    const parseRow = (text: string) => {
      const row: string[] = [];
      let insideQuote = false;
      let entry = '';
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entry.trim().replace(/^"|"$/g, ''));
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim().replace(/^"|"$/g, ''));
      return row;
    };
    const headers = parseRow(lines[0]);
    const dataRows = lines.slice(1).map(line => {
      const values = parseRow(line);
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = values[i] || '';
      });
      return obj;
    });
    return dataRows;
  }

  // Server-side proxy for Google Apps Script Web App
  // Avoids browser CORS and 302 redirect issues
  app.get('/api/gas-proxy', async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || 'https://script.google.com/macros/s/AKfycbxZDitnkYKQlvxgYMFZUFYxlsuDut3YbVe9---fr1kDRtoIVnwxwdjS4wDu0o40lxe2cA/exec';
      const spreadsheetId = '1D5LCyHw3o6v6cGh_-IkYTzNL7tEEaPZvewE4iMFJL0c';

      // Attempt 1: Fetch directly from Google Apps Script Web App URL
      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
        });

        if (response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            if (data && (Array.isArray(data) || Array.isArray(data.data) || Array.isArray(data.staffList))) {
              return res.json(data);
            }
          } catch {
            console.warn('GAS Web App did not return JSON, attempting spreadsheet fallbacks...');
          }
        }
      } catch (gasErr) {
        console.warn('Fetch from GAS Web App URL failed:', gasErr);
      }

      // Attempt 2: Fetch via Google Spreadsheet gviz JSON endpoint
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
        const gvizRes = await fetch(gvizUrl, { method: 'GET', redirect: 'follow' });
        if (gvizRes.ok) {
          const gvizText = await gvizRes.text();
          const parsedRows = parseGvizResponse(gvizText);
          if (parsedRows && parsedRows.length > 0) {
            return res.json(parsedRows);
          }
        }
      } catch (gvizErr) {
        console.warn('gviz endpoint fallback failed:', gvizErr);
      }

      // Attempt 3: Fetch via Google Spreadsheet CSV export endpoint
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
        const csvRes = await fetch(csvUrl, { method: 'GET', redirect: 'follow' });
        if (csvRes.ok) {
          const csvText = await csvRes.text();
          const csvRows = parseCSV(csvText);
          if (csvRows && csvRows.length > 0) {
            return res.json(csvRows);
          }
        }
      } catch (csvErr) {
        console.warn('CSV export fallback failed:', csvErr);
      }

      return res.status(400).json({
        error: 'Sila pastikan Web App disebar (deploy) di Google Apps Script dengan kebenaran "Who has access: Anyone".'
      });
    } catch (error: any) {
      console.error('Error in /api/gas-proxy:', error);
      return res.status(500).json({
        error: error.message || 'Gagal menyambung ke Google Apps Script / Google Sheets'
      });
    }
  });

  // Server-side proxy specifically for StaffCommittee sheet data
  app.get('/api/committee-proxy', async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || 'https://script.google.com/macros/s/AKfycbxZDitnkYKQlvxgYMFZUFYxlsuDut3YbVe9---fr1kDRtoIVnwxwdjS4wDu0o40lxe2cA/exec';
      const spreadsheetId = '1D5LCyHw3o6v6cGh_-IkYTzNL7tEEaPZvewE4iMFJL0c';
      const sheetName = 'StaffCommittee';

      // Attempt 1: Fetch via gviz JSON endpoint specifying sheet=StaffCommittee
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        const gvizRes = await fetch(gvizUrl, { method: 'GET', redirect: 'follow' });
        if (gvizRes.ok) {
          const gvizText = await gvizRes.text();
          const parsedRows = parseGvizResponse(gvizText);
          if (parsedRows && parsedRows.length > 0) {
            return res.json(parsedRows);
          }
        }
      } catch {
        // Fallback silently
      }

      // Attempt 2: Fetch via GAS Web App with sheet parameter
      try {
        const gasUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(gasUrl, { method: 'GET', redirect: 'follow' });
        if (response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            const list = Array.isArray(data) ? data : (data.committeeList || data.data || data.committees);
            if (Array.isArray(list) && list.length > 0) {
              return res.json(list);
            }
          } catch {
            // Fallback silently
          }
        }
      } catch {
        // Fallback silently
      }

      // Attempt 3: Fetch via CSV export specifying sheet=StaffCommittee
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
        const csvRes = await fetch(csvUrl, { method: 'GET', redirect: 'follow' });
        if (csvRes.ok) {
          const csvText = await csvRes.text();
          const csvRows = parseCSV(csvText);
          if (csvRows && csvRows.length > 0) {
            return res.json(csvRows);
          }
        }
      } catch (csvErr) {
        console.warn('CSV committee endpoint fallback failed:', csvErr);
      }

      // Fallback empty list if sheet not yet populated
      return res.json([]);
    } catch (error: any) {
      console.error('Error in /api/committee-proxy:', error);
      return res.status(500).json({
        error: error.message || 'Gagal menyambung ke sheet StaffCommittee'
      });
    }
  });

  // Direct fast server-side Firestore proxy endpoints
  app.get('/api/firestore/staff', async (req, res) => {
    try {
      const summarySnap = await getDoc(doc(serverDb, 'system', 'staff_data'));
      if (summarySnap.exists() && summarySnap.data()?.data) {
        return res.json(summarySnap.data().data);
      }
      const staffSnap = await getDocs(collection(serverDb, 'staff'));
      const staffList: any[] = [];
      staffSnap.forEach((d) => staffList.push(d.data()));
      return res.json(staffList);
    } catch (err: any) {
      console.warn('Server Firestore staff fetch error:', err.message);
      return res.status(500).json({ error: err.message, data: [] });
    }
  });

  app.post('/api/firestore/staff', async (req, res) => {
    try {
      const { staffList } = req.body;
      if (!Array.isArray(staffList)) {
        return res.status(400).json({ error: 'staffList array required' });
      }
      await setDoc(doc(serverDb, 'system', 'staff_data'), {
        updatedAt: new Date().toISOString(),
        count: staffList.length,
        data: staffList,
      });

      // Background individual doc upserts
      (async () => {
        try {
          const chunkSize = 400;
          for (let i = 0; i < staffList.length; i += chunkSize) {
            const chunk = staffList.slice(i, i + chunkSize);
            const batch = writeBatch(serverDb);
            chunk.forEach((s: any) => {
              const rawId = s.ID || s.staff_id || `ST_${Math.random().toString(36).substring(2, 8)}`;
              const docId = rawId.toUpperCase().trim().replace(/[\/\s]/g, '_');
              batch.set(doc(serverDb, 'staff', docId), s, { merge: true });
            });
            await batch.commit();
          }
        } catch (bgErr) {
          console.warn('Background staff chunk write error:', bgErr);
        }
      })();

      return res.json({ success: true, count: staffList.length });
    } catch (err: any) {
      console.warn('Server Firestore staff save error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/firestore/committees', async (req, res) => {
    try {
      const summarySnap = await getDoc(doc(serverDb, 'system', 'committee_data'));
      if (summarySnap.exists() && summarySnap.data()?.data) {
        return res.json(summarySnap.data().data);
      }
      const commSnap = await getDocs(collection(serverDb, 'committees'));
      const list: any[] = [];
      commSnap.forEach((d) => list.push(d.data()));
      return res.json(list);
    } catch (err: any) {
      console.warn('Server Firestore committee fetch error:', err.message);
      return res.status(500).json({ error: err.message, data: [] });
    }
  });

  app.post('/api/firestore/committees', async (req, res) => {
    try {
      const { committeesList } = req.body;
      if (!Array.isArray(committeesList)) {
        return res.status(400).json({ error: 'committeesList array required' });
      }
      await setDoc(doc(serverDb, 'system', 'committee_data'), {
        updatedAt: new Date().toISOString(),
        count: committeesList.length,
        data: committeesList,
      });

      // Background individual committee doc upserts
      (async () => {
        try {
          const chunkSize = 400;
          for (let i = 0; i < committeesList.length; i += chunkSize) {
            const chunk = committeesList.slice(i, i + chunkSize);
            const batch = writeBatch(serverDb);
            chunk.forEach((c: any, idx: number) => {
              const rawId = c.id || `c-${c.staff_id || 'st'}-${i + idx}`;
              const docId = rawId.replace(/[\/\s]/g, '_');
              batch.set(doc(serverDb, 'committees', docId), c, { merge: true });
            });
            await batch.commit();
          }
        } catch (bgErr) {
          console.warn('Background committee chunk write error:', bgErr);
        }
      })();

      return res.json({ success: true, count: committeesList.length });
    } catch (err: any) {
      console.warn('Server Firestore committee save error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
