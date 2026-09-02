export { readExperienceCatalog } from './manifest.js';
const accessRank = {
    public: 0,
    'account-required': 1,
    'approval-required': 2,
    private: 3,
    unspecified: 4,
};
const actionableSupport = new Set(['supported', 'preview', 'experimental']);
/** Return the least permissive access value. `unspecified` is compatibility-only and safest. */
export function mostRestrictiveAccess(...values) {
    if (values.length === 0)
        throw new Error('mostRestrictiveAccess requires at least one access value');
    return values.reduce((most, value) => accessRank[value] > accessRank[most] ? value : most);
}
export function validateExperienceCatalogSemantics(catalog, context = 'experience catalog') {
    const artifacts = new Set();
    for (const artifact of catalog.artifacts) {
        if (artifacts.has(artifact.id))
            throw new Error(`${context} contains duplicate artifact ${artifact.id}`);
        artifacts.add(artifact.id);
    }
    const experiences = new Set();
    for (const experience of catalog.experiences) {
        if (experiences.has(experience.id))
            throw new Error(`${context} contains duplicate experience ${experience.id}`);
        experiences.add(experience.id);
        const paths = new Set();
        for (const adoptionPath of experience.adoptionPaths) {
            if (paths.has(adoptionPath.id))
                throw new Error(`${context} experience ${experience.id} contains duplicate adoption path ${adoptionPath.id}`);
            paths.add(adoptionPath.id);
            for (const artifactId of adoptionPath.artifactIds) {
                if (!artifacts.has(artifactId)) {
                    throw new Error(`${context} experience ${experience.id} adoption path ${adoptionPath.id} requires unknown artifact ${artifactId}`);
                }
            }
        }
    }
}
export function evaluateAdoptionPath(path, artifactById) {
    const artifacts = path.artifactIds.map((id) => {
        const artifact = artifactById.get(id);
        if (!artifact)
            throw new Error(`adoption path ${path.id} requires unknown artifact ${id}`);
        return artifact;
    });
    const effectiveAccess = mostRestrictiveAccess(path.access, ...artifacts.map((artifact) => artifact.access));
    const unavailable = artifacts.filter((artifact) => artifact.availability !== 'available');
    const blockers = [];
    if (!actionableSupport.has(path.support))
        blockers.push('non-actionable-support');
    if (unavailable.length > 0)
        blockers.push('unavailable-artifact');
    if (effectiveAccess === 'private')
        blockers.push('private-access');
    if (!path.url)
        blockers.push('missing-url');
    const explanation = explainBlockers(path.support, effectiveAccess, unavailable, Boolean(path.url));
    return {
        ...path,
        artifacts,
        effectiveAccess,
        actionable: blockers.length === 0,
        blockers,
        ...(explanation ? { explanation } : {}),
    };
}
export function evaluateExperienceCatalog(catalog) {
    validateExperienceCatalogSemantics(catalog);
    const artifacts = new Map(catalog.artifacts.map((artifact) => [artifact.id, artifact]));
    return catalog.experiences.map((experience) => ({
        ...experience,
        compatibility: false,
        adoptionPaths: experience.adoptionPaths.map((path) => evaluateAdoptionPath(path, artifacts)),
    }));
}
/**
 * Join manifest experience references to the Website-owned catalog. Immutable v1-v3 manifests are
 * projected as explicitly non-actionable compatibility experiences instead of inheriting trust.
 */
export function normalizeManifestExperiences(manifest, catalog) {
    if (manifest.schema !== 'b10x-docs/v4')
        return normalizeLegacyManifestExperiences(manifest);
    if (!catalog)
        throw new Error(`${manifest.repository.id} b10x-docs/v4 normalization requires a b10x-experiences/v1 catalog`);
    validateManifestExperienceReferences(manifest, catalog);
    const evaluated = new Map(evaluateExperienceCatalog(catalog).map((experience) => [experience.id, experience]));
    return manifest.surfaces.map((surface) => ({
        surfaceKey: `${manifest.repository.id}/${surface.id}`,
        compatibility: false,
        experienceIds: [...surface.experienceIds],
        experiences: surface.experienceIds.map((id) => evaluated.get(id)),
    }));
}
export function validateManifestExperienceReferences(manifest, catalog) {
    validateExperienceCatalogSemantics(catalog);
    const experienceIds = new Set(catalog.experiences.map((experience) => experience.id));
    for (const surface of manifest.surfaces) {
        const context = `${manifest.repository.id}/${surface.id}`;
        for (const id of surface.experienceIds) {
            if (!experienceIds.has(id))
                throw new Error(`${context} references unknown experience ${id}`);
        }
        for (const id of surface.documentDefaults.experienceIds) {
            if (!surface.experienceIds.includes(id))
                throw new Error(`${context} document default experience ${id} is not declared by the surface`);
        }
    }
}
function normalizeLegacyManifestExperiences(manifest) {
    return manifest.surfaces.map((surface) => {
        const journeys = uniqueJourneys(surface.journeys);
        const experienceIds = journeys.map(compatibilityExperienceId);
        return {
            surfaceKey: `${manifest.repository.id}/${surface.id}`,
            compatibility: true,
            experienceIds,
            experiences: journeys.map((journey) => compatibilityExperience(surface, journey)),
        };
    });
}
function compatibilityExperience(surface, journey) {
    const adoption = 'adoption' in surface ? surface.adoption : undefined;
    return {
        id: compatibilityExperienceId(journey),
        label: `Legacy ${journey}`,
        summary: `Compatibility projection for the ${journey} journey; access and support were not declared.`,
        audiences: 'audiences' in surface ? [...(surface.audiences ?? [])] : [],
        compatibility: true,
        adoptionPaths: [compatibilityAdoptionPath(surface, adoption)],
    };
}
function compatibilityAdoptionPath(surface, adoption) {
    const url = adoption?.url ?? surface.canonicalUrl;
    return {
        id: 'legacy',
        label: adoption?.label ?? 'Read legacy documentation',
        support: 'unspecified',
        access: 'unspecified',
        artifactIds: [],
        ...(url ? { url } : {}),
        ...(adoption?.estimatedMinutes ? { estimatedMinutes: adoption.estimatedMinutes } : {}),
        ...(adoption?.prerequisites ? { prerequisites: [...adoption.prerequisites] } : {}),
        ...(adoption?.outcome ? { outcome: adoption.outcome } : {}),
        artifacts: [],
        effectiveAccess: 'unspecified',
        actionable: false,
        blockers: ['unspecified-contract'],
        explanation: 'This legacy declaration does not specify access, support, or required artifacts.',
    };
}
function compatibilityExperienceId(journey) {
    return `legacy-${journey}`;
}
function uniqueJourneys(journeys) {
    return [...new Set(journeys ?? [])];
}
function explainBlockers(support, access, unavailable, hasUrl) {
    const reasons = [];
    if (!actionableSupport.has(support))
        reasons.push(`Support status is ${support}.`);
    if (unavailable.length > 0) {
        reasons.push(`Required artifacts are not available: ${unavailable.map((artifact) => `${artifact.id} (${artifact.availability})`).join(', ')}.`);
    }
    if (access === 'private')
        reasons.push('Effective access is private.');
    if (access === 'unspecified')
        reasons.push('Access is unspecified.');
    if (!hasUrl)
        reasons.push('No adoption URL is declared.');
    return reasons.length > 0 ? reasons.join(' ') : undefined;
}
