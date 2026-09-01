import type { EcosystemRegistry, RegistrySurface, SourceNavigation } from './types.js';
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
export declare function deriveEcosystemNavigation(input: EcosystemRegistry | readonly RegistrySurface[], options?: EcosystemNavigationOptions): EcosystemNavigation;
export declare function surfaceNavigation(surface: RegistrySurface): SourceNavigation | undefined;
