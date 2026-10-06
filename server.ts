import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
