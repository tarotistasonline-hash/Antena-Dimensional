import { LogEntry } from "./types";

const FILE_NAME = "Antena Dimensional - Registro de Contacto";

/**
 * Buscas si la hoja de cálculo ya existe en Google Drive, si no, la crea.
 * Retorna el spreadsheetId.
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  try {
    // 1. Buscar si el archivo ya existe
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${FILE_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
    )}&fields=files(id,name)`;

    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Error al buscar archivo en Drive: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      // Retorna el ID de la hoja existente
      return searchData.files[0].id;
    }

    // 2. Si no existe, crear la hoja de cálculo en Drive
    const createUrl = "https://www.googleapis.com/drive/v3/files";
    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: FILE_NAME,
        mimeType: "application/vnd.google-apps.spreadsheet",
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Error al crear archivo en Drive: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    const spreadsheetId = createData.id;

    // Obtener el título real de la primera pestaña para evitar errores de idioma (Sheet1 vs Hoja 1)
    const sheetTitle = await getFirstSheetTitle(accessToken, spreadsheetId);

    // 3. Inicializar la hoja escribiendo la fila de encabezados en Sheets API v4
    const initUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:H1?valueInputOption=USER_ENTERED`;
    const headers = [
      "Fecha (UTC)",
      "Tipo de Registro",
      "Frecuencia",
      "Dimensión / Coordenadas",
      "Entidad / Inteligencia",
      "Resonancia %",
      "Mensaje de Transmisión o Recepción",
      "Análisis Espectral de la Señal",
    ];

    const initResponse = await fetch(initUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [headers],
      }),
    });

    if (!initResponse.ok) {
      console.warn("No se pudieron inicializar los encabezados en la hoja de cálculo:", initResponse.statusText);
    }

    return spreadsheetId;
  } catch (error) {
    console.error("Error en findOrCreateSpreadsheet:", error);
    throw error;
  }
}

/**
 * Recupera de forma dinámica el nombre de la primera pestaña de la hoja de cálculo para evitar fallos por idioma.
 */
async function getFirstSheetTitle(accessToken: string, spreadsheetId: string): Promise<string> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.sheets && data.sheets.length > 0) {
        return data.sheets[0].properties.title;
      }
    }
  } catch (e) {
    console.warn("Fallo al obtener el título dinámico de la pestaña:", e);
  }
  return "Sheet1"; // fallback
}

/**
 * Añade una nueva fila al registro de Google Sheets.
 */
export async function appendLogToSheet(
  accessToken: string,
  spreadsheetId: string,
  entry: {
    timestamp: string;
    type: "RECEPTOR" | "TRANSMISOR";
    frequency: string;
    dimension: string;
    entity: string;
    resonance: number;
    message: string;
    spectralAnalysis: string;
  }
): Promise<void> {
  try {
    // Obtener el nombre real de la primera pestaña dinámicamente
    const sheetTitle = await getFirstSheetTitle(accessToken, spreadsheetId);
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A:H:append?valueInputOption=USER_ENTERED`;
    
    // Mapeamos los datos para alinearlos con las columnas del encabezado
    const row = [
      entry.timestamp,
      entry.type,
      entry.frequency,
      entry.dimension,
      entry.entity,
      `${entry.resonance}%`,
      entry.message,
      entry.spectralAnalysis,
    ];

    const response = await fetch(appendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      throw new Error(`Error al añadir fila a Sheets: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error en appendLogToSheet:", error);
    throw error;
  }
}
