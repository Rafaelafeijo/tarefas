// Errors sent by our API carry `data`. Without it the request never got an answer,
// and the browser's own text ("Failed to fetch") wouldn't tell the user anything useful.
export function errorMessage(error: { message: string; data?: unknown }) {
  return error.data ? error.message : "Could not reach the server. Check your connection and try again.";
}
