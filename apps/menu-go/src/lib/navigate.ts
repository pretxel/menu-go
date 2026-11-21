/** Full-page navigation, so the new session cookie is picked up everywhere. Separate for tests. */
export function navigateTo(url: string): void {
  window.location.assign(url);
}
