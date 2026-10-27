/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: RSVP & UCAPAN PERNIKAHAN ICHA & ANDI
 * =========================================================================
 * 
 * SPREADSHEET URL:
 * https://docs.google.com/spreadsheets/d/1B7UT9kZ90kM-DDVcxznsqmGzonuBwciicYPVCg_cP8M/edit?gid=0#gid=0
 * 
 * SPREADSHEET ID : 1B7UT9kZ90kM-DDVcxznsqmGzonuBwciicYPVCg_cP8M
 * SHEET NAME     : Sheet1
 * 
 * SUSUNAN KOLOM (5 Kolom):
 * 1. timestamp
 * 2. nama tamu
 * 3. ucapan
 * 4. konfirmasi kehadiran
 * 5. jumlah tamu
 * =========================================================================
 */

const SPREADSHEET_ID = '1B7UT9kZ90kM-DDVcxznsqmGzonuBwciicYPVCg_cP8M';
const SHEET_NAME = 'Sheet1';

/**
 * Endpoint GET: Digunakan oleh website untuk mengambil seluruh data ucapan
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    
    // Inisialisasi header jika sheet masih kosong
    setupHeaderIfEmpty(sheet);

    const data = sheet.getDataRange().getValues();
    const listUcapan = [];
    
    // Baris 1 adalah header, data dimulai dari baris ke-2
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Pastikan baris tidak kosong
      if (row[1] || row[2]) {
        let formattedDate = row[0];
        if (row[0] instanceof Date) {
          formattedDate = Utilities.formatDate(row[0], 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
        }
        
        listUcapan.push({
          timestamp: formattedDate ? String(formattedDate) : '',
          nama: String(row[1] || '').trim(),
          ucapan: String(row[2] || '').trim(),
          kehadiran: String(row[3] || '').trim(),
          jumlah: String(row[4] || '0').trim()
        });
      }
    }
    
    // Balik urutan agar ucapan terbaru berada di posisi paling atas
    listUcapan.reverse();

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        total: listUcapan.length,
        data: listUcapan
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST: Digunakan oleh form website untuk menyimpan ucapan baru
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    
    setupHeaderIfEmpty(sheet);

    let params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    const now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const nama = (params.nama || params.author || '').trim();
    const ucapan = (params.ucapan || params.comment || '').trim();
    const kehadiran = (params.kehadiran || params.attendance || '').trim();
    let jumlah = String(params.jumlah || params.guest || '1').trim();

    // Jika tidak hadir, set jumlah tamu ke 0
    if (kehadiran.toLowerCase().indexOf('tidak') !== -1) {
      jumlah = '0';
    }

    if (!nama || !ucapan) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Nama dan Ucapan wajib diisi!'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Tambahkan baris baru sesuai urutan 5 kolom yang diminta
    sheet.appendRow([
      now,        // 1. timestamp
      nama,       // 2. nama tamu
      ucapan,     // 3. ucapan
      kehadiran,  // 4. konfirmasi kehadiran
      jumlah      // 5. jumlah tamu
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Terima kasih atas doa dan ucapan Anda!',
        data: {
          timestamp: now,
          nama: nama,
          ucapan: ucapan,
          kehadiran: kehadiran,
          jumlah: jumlah
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Otomatis membuat 5 header kolom jika sheet masih kosong
 */
function setupHeaderIfEmpty(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'timestamp',
      'nama tamu',
      'ucapan',
      'konfirmasi kehadiran',
      'jumlah tamu'
    ]);
    const headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#B09B7B');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
}
