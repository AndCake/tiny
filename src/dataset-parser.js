/**
 * Dataset Parsing Utilities
 *
 * Provides safe parsing of dataset attributes, with support for JSON and primitive types.
 */

/**
 * Safely parse a string value, attempting JSON parsing or returning the original value
 * @param {string} data - The data string to parse
 * @returns {*} Parsed value or original string
 */
export function safeParse(data) {
  // Check if the data looks like a JSON object, array, or string
  if (data.startsWith("{") || data.startsWith("[") || data.startsWith('"')) {
    try {
      const val = JSON.parse(data);
      // Attach original JSON string for reference
      val.json = data;
      return val;
    } catch (_e) {
      // If JSON parsing fails, return original string
      return data;
    }
  }
  // For non-JSON-like strings, return as-is
  return data;
}

/**
 * Parse a dataset, converting each attribute value safely
 * @param {DOMStringMap} dataset - The dataset to parse
 * @returns {Object} Parsed dataset with safely converted values
 */
export function parseDataset(dataset) {
  return Object.keys(dataset).reduce((acc, key) => ({
    ...acc,
    [key]: safeParse(dataset[key]),
  }), {});
}
