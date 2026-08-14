export function hasPublicShareToken(): boolean {
  return Boolean(process.env.PLAYWRIGHT_PUBLIC_SHARE_TOKEN?.trim());
}

export function hasPublicBilanToken(): boolean {
  return Boolean(process.env.PLAYWRIGHT_PUBLIC_BILAN_TOKEN?.trim());
}
