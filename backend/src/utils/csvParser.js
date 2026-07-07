const { parse } = require('csv-parse/sync');

function parseCSV(input) {
  try {
    let stringData = Buffer.isBuffer(input) ? input.toString('utf8') : input;

    if (!stringData || !stringData.trim()) {
      return {
        success: false,
        error: 'CSV input is empty.'
      };
    }

    if (stringData.charCodeAt(0) === 0xFEFF) {
      stringData = stringData.slice(1);
    }

    const records = parse(stringData, {
      columns: (headers) => headers.map((h, i) => (h && h.trim() ? h.trim() : `column_${i + 1}`)),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_records_with_error: false
    });

    const headers = records.length > 0 ? Object.keys(records[0]) : [];

    return {
      success: true,
      totalRows: records.length,
      records,
      headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { parseCSV };
