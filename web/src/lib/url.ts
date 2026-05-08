export function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
