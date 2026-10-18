// Domain map. Each domain is independent:
//   pawprintsnetwork.com -> parent company site (About, Privacy, Terms, links to both apps)
//   instameow.app        -> The Catwalk only (cats)
//   instawoof.app        -> The Dog Park only (dogs)

export type AppBrand = 'cat' | 'dog';

const corporateDomains = new Set(['pawprintsnetwork.com', 'www.pawprintsnetwork.com']);

const appDomains: Record<string, AppBrand> = {
  'instameow.app': 'cat',
  'www.instameow.app': 'cat',
  'instawoof.app': 'dog',
  'www.instawoof.app': 'dog',
};

function clean(hostname: string): string {
  return (hostname || '').trim().toLowerCase();
}

export function isCorporateDomain(hostname: string): boolean {
  return corporateDomains.has(clean(hostname));
}

/** Returns 'cat' or 'dog' for an app domain, or null for any other host. */
export function getAppBrand(hostname: string): AppBrand | null {
  return appDomains[clean(hostname)] ?? null;
}

export function isLandingDomain(hostname: string): boolean {
  const host = clean(hostname);
  return corporateDomains.has(host) || host in appDomains;
}
