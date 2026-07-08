/** Deep clone a JSON-serializable value. */
export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
