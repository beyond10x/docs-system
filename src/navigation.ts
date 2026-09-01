import type {EcosystemRegistry, RegistrySurface, SourceNavigation} from './types.js';

export interface EcosystemFamily {
  name: string;
  surfaces: RegistrySurface[];
}

export interface EcosystemNavigation {
  /** Ungrouped front-door surfaces, kept separate from the project families. */
  frontDoors: RegistrySurface[];
  /** Explicit families derived only from source.navigation.group. */
  families: EcosystemFamily[];
  /** Surfaces without enough navigation metadata to place in either collection. */
  ungrouped: RegistrySurface[];
}

export interface EcosystemNavigationOptions {
  /** Preferred family sequence. Unlisted declared families follow in lexical order. */
  familyOrder?: readonly string[];
}

/**
 * Derive presentation-ready navigation without encoding an organization taxonomy in the library.
 * Repository declarations own family membership and item order; the caller may own family order.
 */
export function deriveEcosystemNavigation(
  input: EcosystemRegistry | readonly RegistrySurface[],
  options: EcosystemNavigationOptions = {},
): EcosystemNavigation {
  const surfaces = 'surfaces' in input ? input.surfaces : input;
  const preferred = new Map<string, number>();
  for (const name of options.familyOrder ?? []) {
    if (!preferred.has(name)) preferred.set(name, preferred.size);
  }

  const frontDoors: RegistrySurface[] = [];
  const ungrouped: RegistrySurface[] = [];
  const grouped = new Map<string, RegistrySurface[]>();
  for (const surface of surfaces) {
    const navigation = surfaceNavigation(surface);
    const group = navigation?.group?.trim();
    if (surface.kind === 'front-door' && !group) {
      frontDoors.push(surface);
    } else if (group) {
      grouped.set(group, [...(grouped.get(group) ?? []), surface]);
    } else {
      ungrouped.push(surface);
    }
  }

  frontDoors.sort(compareSurface);
  ungrouped.sort(compareSurface);
  const families = [...grouped].map(([name, members]) => ({name, surfaces: members.sort(compareSurface)}));
  families.sort((left, right) => {
    const leftOrder = preferred.get(left.name);
    const rightOrder = preferred.get(right.name);
    if (leftOrder !== undefined || rightOrder !== undefined) {
      if (leftOrder === undefined) return 1;
      if (rightOrder === undefined) return -1;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    }
    return compareText(left.name, right.name);
  });
  return {frontDoors, families, ungrouped};
}

export function surfaceNavigation(surface: RegistrySurface): SourceNavigation | undefined {
  return 'source' in surface ? surface.source.navigation : undefined;
}

function compareSurface(left: RegistrySurface, right: RegistrySurface): number {
  const leftNavigation = surfaceNavigation(left);
  const rightNavigation = surfaceNavigation(right);
  const order = (leftNavigation?.order ?? Number.MAX_SAFE_INTEGER) - (rightNavigation?.order ?? Number.MAX_SAFE_INTEGER);
  if (order !== 0) return order;
  const label = compareText(leftNavigation?.label ?? left.name, rightNavigation?.label ?? right.name);
  return label || compareText(left.key, right.key);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
