import { GAS_CONFIG } from '../config/gasConfig';
import { Staff, StaffCommittee } from '../types';
import { parseCommitteeRows } from './committeeService';

/**
 * Parse Google Sheets gviz JSON response
 */
export function parseGvizResponse(gvizText: string): any[] | null {
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

/**
 * Parse standard CSV text
 */
export function parseCSV(csvText: string): any[] | null {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
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
  const dataRows = lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = values[i] || '';
    });
    return obj;
  });
  return dataRows;
}

/**
 * Robust fetcher for Staff list with automatic client-side fallbacks.
 * Works on custom domains, static hostings, and local proxy servers.
 */
export async function fetchStaffDataFromRemote(): Promise<any[]> {
  const targetUrl = GAS_CONFIG.webAppUrl;
  const spreadsheetId = GAS_CONFIG.spreadsheetId;

  // Attempt 1: Server proxy /api/gas-proxy (if backend is active)
  try {
    const proxyUrl = `/api/gas-proxy?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { method: 'GET' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && !data.error) {
          const arr = Array.isArray(data) ? data : data.data || data.staffList;
          if (Array.isArray(arr) && arr.length > 0) {
            return arr;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Proxy fetch /api/gas-proxy unavailable (static export mode?):', err);
  }

  // Attempt 2: Direct Client Fetch to Google Apps Script Web App URL
  try {
    const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    if (response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : data.data || data.staffList;
        if (Array.isArray(arr) && arr.length > 0) {
          return arr;
        }
      } catch {
        console.warn('Direct GAS Web App returned non-JSON text');
      }
    }
  } catch (err) {
    console.warn('Direct GAS Web App fetch failed:', err);
  }

  // Attempt 3: Direct Client Fetch from Google Spreadsheet gviz JSON endpoint
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const gvizRes = await fetch(gvizUrl, { method: 'GET', redirect: 'follow' });
    if (gvizRes.ok) {
      const gvizText = await gvizRes.text();
      const parsedRows = parseGvizResponse(gvizText);
      if (parsedRows && parsedRows.length > 0) {
        return parsedRows;
      }
    }
  } catch (err) {
    console.warn('Direct gviz endpoint fetch failed:', err);
  }

  // Attempt 4: Direct Client Fetch from Google Spreadsheet CSV export endpoint
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    const csvRes = await fetch(csvUrl, { method: 'GET', redirect: 'follow' });
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      const csvRows = parseCSV(csvText);
      if (csvRows && csvRows.length > 0) {
        return csvRows;
      }
    }
  } catch (err) {
    console.warn('Direct CSV export endpoint fetch failed:', err);
  }

  throw new Error('Gagal memuatkan data dari Google Apps Script & Google Sheets. Pastikan akses Google Sheet didagangkan secara umum (Anyone with the link).');
}

/**
 * Robust fetcher for Committee list with automatic client-side fallbacks.
 */
export async function fetchCommitteeDataFromRemote(): Promise<StaffCommittee[]> {
  const targetUrl = GAS_CONFIG.webAppUrl;
  const spreadsheetId = GAS_CONFIG.spreadsheetId;
  const sheetName = 'StaffCommittee';

  // Attempt 1: Server proxy /api/committee-proxy (if backend is active)
  try {
    const res = await fetch('/api/committee-proxy', { method: 'GET' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return parseCommitteeRows(data);
        }
      }
    }
  } catch (err) {
    console.warn('Proxy /api/committee-proxy unavailable:', err);
  }

  // Attempt 2: Direct gviz JSON endpoint for StaffCommittee sheet
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const gvizRes = await fetch(gvizUrl, { method: 'GET', redirect: 'follow' });
    if (gvizRes.ok) {
      const gvizText = await gvizRes.text();
      const parsedRows = parseGvizResponse(gvizText);
      if (parsedRows && parsedRows.length > 0) {
        return parseCommitteeRows(parsedRows);
      }
    }
  } catch (err) {
    console.warn('Direct gviz committee fetch failed:', err);
  }

  // Attempt 3: Direct GAS Web App with ?sheet=StaffCommittee
  try {
    const gasUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(gasUrl, { method: 'GET', redirect: 'follow' });
    if (response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data : data.committeeList || data.data || data.committees;
        if (Array.isArray(list) && list.length > 0) {
          return parseCommitteeRows(list);
        }
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('Direct GAS Web App committee fetch failed:', err);
  }

  // Attempt 4: Direct CSV export for StaffCommittee sheet
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
    const csvRes = await fetch(csvUrl, { method: 'GET', redirect: 'follow' });
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      const csvRows = parseCSV(csvText);
      if (csvRows && csvRows.length > 0) {
        return parseCommitteeRows(csvRows);
      }
    }
  } catch (err) {
    console.warn('Direct CSV committee fetch failed:', err);
  }

  return [];
}
