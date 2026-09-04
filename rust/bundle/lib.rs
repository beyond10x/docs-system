use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Component, Path, PathBuf};

pub const BUNDLE_SCHEMA: &str = "b10x-docs-bundle/v1";
const COLLECTION_SCHEMA: &str = "b10x-docs-collection/v1";
const MANIFEST_FILE: &str = "b10x.docs.yaml";
const COLLECTION_FILE: &str = "collection.json";
const BUNDLE_FILE: &str = "bundle.json";
const TREE_DIRECTORY: &str = "tree";

pub type Result<T> = std::result::Result<T, BundleError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BundleError(String);

impl BundleError {
    fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl Display for BundleError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.0)
    }
}

impl std::error::Error for BundleError {}

#[derive(Debug, Clone)]
pub struct BuildOptions {
    pub repository_root: PathBuf,
    pub collection: PathBuf,
    pub output: PathBuf,
    pub commit: String,
    pub producer_run_id: u64,
    pub artifact_id: Option<u64>,
    pub artifact_digest: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct ValidationExpectations {
    pub repository_id: Option<String>,
    pub repository_url: Option<String>,
    pub commit: Option<String>,
    pub producer_run_id: Option<u64>,
    pub artifact_id: Option<u64>,
    pub artifact_digest: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BundleManifest {
    pub schema: String,
    pub repository: BundleRepository,
    pub commit: String,
    pub producer: BundleProducer,
    pub manifest_sha256: String,
    pub collection_sha256: String,
    pub content_sha256: String,
    pub files: Vec<BundleFile>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BundleRepository {
    pub id: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BundleProducer {
    pub run_id: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artifact_id: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artifact_digest: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BundleFile {
    pub path: String,
    pub sha256: String,
    pub size: u64,
}

#[derive(Debug, Deserialize)]
struct SourceManifestHeader {
    schema: String,
    repository: SourceRepository,
}

#[derive(Debug, Deserialize)]
struct ChangeHeader {
    schema: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SourceRepository {
    id: String,
    url: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CollectionIndex {
    schema: String,
    repository: CollectionRepository,
    files: Vec<CollectionSource>,
    content_sha256: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CollectionRepository {
    id: String,
    url: String,
    display_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CollectionSource {
    repository: String,
    surface: String,
    kind: String,
    source_path: String,
    output_path: String,
    sha256: String,
    size: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    specification_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    route: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CollectionDigestSource<'a> {
    repository: &'a str,
    surface: &'a str,
    kind: &'a str,
    source_path: &'a str,
    output_path: &'a str,
    sha256: &'a str,
    size: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    specification_id: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    route: Option<&'a str>,
}

struct ValidatedSource {
    file: BundleFile,
    bytes: Vec<u8>,
}

pub fn build_bundle(options: &BuildOptions) -> Result<BundleManifest> {
    validate_commit(&options.commit)?;
    validate_positive_id(options.producer_run_id, "producer run id")?;
    validate_artifact_identity(options.artifact_id, options.artifact_digest.as_deref())?;
    refuse_existing_output(&options.output)?;

    let repository_root = canonical_directory(&options.repository_root, "repository root")?;
    let manifest_bytes = read_source_file(&repository_root, MANIFEST_FILE)?;
    let manifest_header = parse_source_manifest(&manifest_bytes)?;
    let collection_bytes = read_regular_file(&options.collection, "collection index")?;
    let collection = parse_collection(&collection_bytes)?;
    validate_repository_identity(&manifest_header, &collection)?;
    let sources = merge_sources(
        validate_collection_sources(&collection, &repository_root)?,
        validate_change_sources(&repository_root)?,
    )?;
    let files = sources
        .iter()
        .map(|source| source.file.clone())
        .collect::<Vec<_>>();

    let manifest = BundleManifest {
        schema: BUNDLE_SCHEMA.to_owned(),
        repository: BundleRepository {
            id: collection.repository.id.clone(),
            url: collection.repository.url.clone(),
        },
        commit: options.commit.clone(),
        producer: BundleProducer {
            run_id: options.producer_run_id,
            artifact_id: options.artifact_id,
            artifact_digest: options.artifact_digest.clone(),
        },
        manifest_sha256: sha256(&manifest_bytes),
        collection_sha256: sha256(&collection_bytes),
        content_sha256: inventory_digest(&files)?,
        files,
    };

    let parent = options
        .output
        .parent()
        .filter(|path| !path.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent).map_err(|error| {
        BundleError::new(format!(
            "create output parent {}: {error}",
            parent.display()
        ))
    })?;
    let staging = tempfile::Builder::new()
        .prefix(".b10x-docs-bundle-")
        .tempdir_in(parent)
        .map_err(|error| {
            BundleError::new(format!(
                "create staging directory in {}: {error}",
                parent.display()
            ))
        })?;

    write_file(&staging.path().join(MANIFEST_FILE), &manifest_bytes)?;
    write_file(&staging.path().join(COLLECTION_FILE), &collection_bytes)?;
    fs::create_dir_all(staging.path().join(TREE_DIRECTORY))
        .map_err(|error| BundleError::new(format!("create {TREE_DIRECTORY}/: {error}")))?;
    for source in &sources {
        write_file(
            &staging
                .path()
                .join(TREE_DIRECTORY)
                .join(path_from_posix(&source.file.path)),
            &source.bytes,
        )?;
    }
    write_file(
        &staging.path().join(BUNDLE_FILE),
        &canonical_json(&manifest)?,
    )?;
    fs::rename(staging.path(), &options.output).map_err(|error| {
        BundleError::new(format!(
            "publish bundle to {}: {error}",
            options.output.display()
        ))
    })?;

    Ok(manifest)
}

pub fn validate_bundle(
    bundle_root: &Path,
    expected: &ValidationExpectations,
) -> Result<BundleManifest> {
    validate_bundle_root(bundle_root)?;
    let manifest_bytes = read_bundle_file(bundle_root, BUNDLE_FILE)?;
    let manifest: BundleManifest = serde_json::from_slice(&manifest_bytes).map_err(|error| {
        BundleError::new(format!(
            "{BUNDLE_FILE} is not a valid {BUNDLE_SCHEMA} manifest: {error}"
        ))
    })?;
    validate_bundle_manifest_fields(&manifest)?;
    let canonical = canonical_json(&manifest)?;
    if manifest_bytes != canonical {
        return Err(BundleError::new(format!(
            "{BUNDLE_FILE} is not canonical JSON"
        )));
    }

    let source_manifest_bytes = read_bundle_file(bundle_root, MANIFEST_FILE)?;
    let source_manifest = parse_source_manifest(&source_manifest_bytes)?;
    let collection_bytes = read_bundle_file(bundle_root, COLLECTION_FILE)?;
    let collection = parse_collection(&collection_bytes)?;
    validate_repository_identity(&source_manifest, &collection)?;
    let tree_root = bundle_root.join(TREE_DIRECTORY);
    let sources = merge_sources(
        validate_collection_sources(&collection, &tree_root)?,
        validate_change_sources(&tree_root)?,
    )?;
    let files = sources
        .iter()
        .map(|source| source.file.clone())
        .collect::<Vec<_>>();

    if manifest.repository.id != collection.repository.id
        || manifest.repository.url != collection.repository.url
    {
        return Err(BundleError::new(
            "bundle repository identity does not match b10x.docs.yaml and collection.json",
        ));
    }
    compare_digest(
        "manifestSha256",
        &manifest.manifest_sha256,
        &sha256(&source_manifest_bytes),
    )?;
    compare_digest(
        "collectionSha256",
        &manifest.collection_sha256,
        &sha256(&collection_bytes),
    )?;
    compare_digest(
        "contentSha256",
        &manifest.content_sha256,
        &inventory_digest(&files)?,
    )?;
    if manifest.files != files {
        return Err(BundleError::new(
            "bundle file inventory does not match collection.json and tree/",
        ));
    }
    validate_tree_inventory(&tree_root, &manifest.files)?;
    validate_expectations(&manifest, expected)?;
    Ok(manifest)
}

fn validate_bundle_manifest_fields(manifest: &BundleManifest) -> Result<()> {
    if manifest.schema != BUNDLE_SCHEMA {
        return Err(BundleError::new(format!("unsupported bundle schema {}; consumers must add support before producers emit a new version", manifest.schema)));
    }
    validate_repository(&manifest.repository.id, &manifest.repository.url)?;
    validate_commit(&manifest.commit)?;
    validate_positive_id(manifest.producer.run_id, "producer run id")?;
    validate_artifact_identity(
        manifest.producer.artifact_id,
        manifest.producer.artifact_digest.as_deref(),
    )?;
    validate_sha256(&manifest.manifest_sha256, "manifestSha256")?;
    validate_sha256(&manifest.collection_sha256, "collectionSha256")?;
    validate_sha256(&manifest.content_sha256, "contentSha256")?;
    let mut previous: Option<&str> = None;
    for file in &manifest.files {
        validate_relative_path(&file.path, "bundle file path")?;
        validate_sha256(&file.sha256, &format!("{} sha256", file.path))?;
        if let Some(path) = previous {
            if path >= file.path.as_str() {
                return Err(BundleError::new(
                    "bundle file inventory must be strictly sorted by path",
                ));
            }
        }
        previous = Some(&file.path);
    }
    Ok(())
}

fn parse_source_manifest(bytes: &[u8]) -> Result<SourceManifestHeader> {
    let manifest: SourceManifestHeader = serde_yaml::from_slice(bytes)
        .map_err(|error| BundleError::new(format!("{MANIFEST_FILE} is not valid YAML: {error}")))?;
    if manifest.schema != "b10x-docs/v3" && manifest.schema != "b10x-docs/v4" {
        return Err(BundleError::new(format!(
            "{MANIFEST_FILE} must use b10x-docs/v3 or b10x-docs/v4"
        )));
    }
    validate_repository(&manifest.repository.id, &manifest.repository.url)?;
    Ok(manifest)
}

fn parse_collection(bytes: &[u8]) -> Result<CollectionIndex> {
    let collection: CollectionIndex = serde_json::from_slice(bytes).map_err(|error| {
        BundleError::new(format!(
            "{COLLECTION_FILE} is not a valid {COLLECTION_SCHEMA} index: {error}"
        ))
    })?;
    if collection.schema != COLLECTION_SCHEMA {
        return Err(BundleError::new(format!(
            "{COLLECTION_FILE} must use {COLLECTION_SCHEMA}"
        )));
    }
    validate_repository(&collection.repository.id, &collection.repository.url)?;
    if collection.repository.display_name.trim().is_empty() {
        return Err(BundleError::new(
            "collection repository displayName must not be empty",
        ));
    }
    validate_sha256(&collection.content_sha256, "collection contentSha256")?;
    Ok(collection)
}

fn validate_repository_identity(
    manifest: &SourceManifestHeader,
    collection: &CollectionIndex,
) -> Result<()> {
    if manifest.repository.id != collection.repository.id
        || manifest.repository.url != collection.repository.url
    {
        return Err(BundleError::new(format!(
            "repository identity differs between {MANIFEST_FILE} and {COLLECTION_FILE}"
        )));
    }
    Ok(())
}

fn validate_collection_sources(
    collection: &CollectionIndex,
    source_root: &Path,
) -> Result<Vec<ValidatedSource>> {
    let digest_entries = collection
        .files
        .iter()
        .map(|file| CollectionDigestSource {
            repository: &file.repository,
            surface: &file.surface,
            kind: &file.kind,
            source_path: &file.source_path,
            output_path: &file.output_path,
            sha256: &file.sha256,
            size: file.size,
            specification_id: file.specification_id.as_deref(),
            route: file.route.as_deref(),
        })
        .collect::<Vec<_>>();
    let digest_bytes = serde_json::to_vec(&digest_entries).map_err(|error| {
        BundleError::new(format!("serialize collection digest projection: {error}"))
    })?;
    compare_digest(
        "collection contentSha256",
        &collection.content_sha256,
        &sha256(&digest_bytes),
    )?;

    let mut outputs = BTreeSet::new();
    let mut routes = BTreeSet::new();
    let mut sources: BTreeMap<String, ValidatedSource> = BTreeMap::new();
    for file in &collection.files {
        if file.repository != collection.repository.id {
            return Err(BundleError::new(format!(
                "{} declares repository {}, expected {}",
                file.source_path, file.repository, collection.repository.id
            )));
        }
        if file.surface.trim().is_empty() {
            return Err(BundleError::new(format!(
                "{} has an empty surface",
                file.source_path
            )));
        }
        if !matches!(
            file.kind.as_str(),
            "document" | "data" | "blog" | "asset" | "openapi" | "json-schema"
        ) {
            return Err(BundleError::new(format!(
                "{} has unsupported collection kind {}",
                file.source_path, file.kind
            )));
        }
        validate_relative_path(&file.source_path, "collection sourcePath")?;
        validate_relative_path(&file.output_path, "collection outputPath")?;
        validate_sha256(&file.sha256, &format!("{} sha256", file.source_path))?;
        if !outputs.insert(file.output_path.clone()) {
            return Err(BundleError::new(format!(
                "duplicate collection outputPath {}",
                file.output_path
            )));
        }
        if let Some(route) = &file.route {
            if !route.starts_with('/') || route.contains('\\') {
                return Err(BundleError::new(format!(
                    "{} has invalid route {route}",
                    file.source_path
                )));
            }
            if !routes.insert(route.clone()) {
                return Err(BundleError::new(format!(
                    "duplicate collection route {route}"
                )));
            }
        }
        if file
            .specification_id
            .as_deref()
            .is_some_and(|id| id.trim().is_empty())
        {
            return Err(BundleError::new(format!(
                "{} has an empty specificationId",
                file.source_path
            )));
        }

        let bytes = read_source_file(source_root, &file.source_path)?;
        if bytes.len() as u64 != file.size {
            return Err(BundleError::new(format!(
                "{} size is {}, expected {}",
                file.source_path,
                bytes.len(),
                file.size
            )));
        }
        let actual_sha256 = sha256(&bytes);
        compare_digest(
            &format!("{} sha256", file.source_path),
            &file.sha256,
            &actual_sha256,
        )?;
        let inventory = BundleFile {
            path: file.source_path.clone(),
            sha256: actual_sha256,
            size: bytes.len() as u64,
        };
        match sources.get(&file.source_path) {
            Some(previous) if previous.file != inventory => {
                return Err(BundleError::new(format!(
                    "{} is selected more than once with inconsistent bytes",
                    file.source_path
                )));
            }
            Some(_) => {}
            None => {
                sources.insert(
                    file.source_path.clone(),
                    ValidatedSource {
                        file: inventory,
                        bytes,
                    },
                );
            }
        }
    }
    Ok(sources.into_values().collect())
}

fn validate_change_sources(source_root: &Path) -> Result<Vec<ValidatedSource>> {
    let change_root = source_root.join("changes");
    let metadata = match fs::symlink_metadata(&change_root) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => return Err(BundleError::new(format!("inspect changes/: {error}"))),
    };
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(BundleError::new(
            "changes/ must be a real directory when present",
        ));
    }
    let mut paths = Vec::new();
    enumerate_changes(source_root, Path::new("changes"), &mut paths)?;
    paths.sort();
    let mut sources = Vec::new();
    for path in paths {
        let bytes = read_source_file(source_root, &path)?;
        let header: ChangeHeader = serde_yaml::from_slice(&bytes)
            .map_err(|error| BundleError::new(format!("{path} is not valid YAML: {error}")))?;
        if header.schema != "b10x-change/v1" && header.schema != "b10x-change/v2" {
            return Err(BundleError::new(format!(
                "{path} must use b10x-change/v1 or b10x-change/v2"
            )));
        }
        sources.push(ValidatedSource {
            file: BundleFile {
                path,
                sha256: sha256(&bytes),
                size: bytes.len() as u64,
            },
            bytes,
        });
    }
    Ok(sources)
}

fn enumerate_changes(root: &Path, relative: &Path, paths: &mut Vec<String>) -> Result<()> {
    let directory = root.join(relative);
    let mut entries = fs::read_dir(&directory)
        .map_err(|error| BundleError::new(format!("read {}: {error}", directory.display())))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|error| BundleError::new(format!("read {}: {error}", directory.display())))?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let file_type = entry.file_type().map_err(|error| {
            BundleError::new(format!("inspect {}: {error}", entry.path().display()))
        })?;
        let child = relative.join(entry.file_name());
        if file_type.is_symlink() {
            return Err(BundleError::new(format!(
                "{} is a symbolic link; change inputs must be regular files",
                child.display()
            )));
        }
        if file_type.is_dir() {
            enumerate_changes(root, &child, paths)?;
        } else if file_type.is_file() {
            if child.extension().and_then(|extension| extension.to_str()) == Some("yaml") {
                paths.push(to_posix(&child)?);
            }
        } else {
            return Err(BundleError::new(format!(
                "{} is not a regular file",
                child.display()
            )));
        }
    }
    Ok(())
}

fn merge_sources(
    collection: Vec<ValidatedSource>,
    changes: Vec<ValidatedSource>,
) -> Result<Vec<ValidatedSource>> {
    let mut merged = BTreeMap::new();
    for source in collection {
        merged.insert(source.file.path.clone(), source);
    }
    for source in changes {
        if merged.contains_key(&source.file.path) {
            return Err(BundleError::new(format!(
                "{} is both a manifest collection source and a changes/**/*.yaml input; overlaps are not allowed",
                source.file.path
            )));
        }
        merged.insert(source.file.path.clone(), source);
    }
    Ok(merged.into_values().collect())
}

fn inventory_digest(files: &[BundleFile]) -> Result<String> {
    let bytes = serde_json::to_vec(files).map_err(|error| {
        BundleError::new(format!(
            "serialize bundle inventory digest projection: {error}"
        ))
    })?;
    Ok(sha256(&bytes))
}

fn validate_tree_inventory(tree_root: &Path, expected: &[BundleFile]) -> Result<()> {
    let mut actual = Vec::new();
    enumerate_tree(tree_root, Path::new(""), &mut actual)?;
    actual.sort();
    let expected_paths = expected
        .iter()
        .map(|file| file.path.clone())
        .collect::<Vec<_>>();
    if actual != expected_paths {
        return Err(BundleError::new("tree/ contains missing or unlisted files"));
    }
    Ok(())
}

fn enumerate_tree(root: &Path, relative: &Path, files: &mut Vec<String>) -> Result<()> {
    let directory = root.join(relative);
    let mut entries = fs::read_dir(&directory)
        .map_err(|error| BundleError::new(format!("read {}: {error}", directory.display())))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|error| BundleError::new(format!("read {}: {error}", directory.display())))?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let file_type = entry.file_type().map_err(|error| {
            BundleError::new(format!("inspect {}: {error}", entry.path().display()))
        })?;
        let child_relative = relative.join(entry.file_name());
        if file_type.is_symlink() {
            return Err(BundleError::new(format!(
                "{} is a symbolic link; bundle trees contain only regular files",
                child_relative.display()
            )));
        }
        if file_type.is_dir() {
            enumerate_tree(root, &child_relative, files)?;
        } else if file_type.is_file() {
            files.push(to_posix(&child_relative)?);
        } else {
            return Err(BundleError::new(format!(
                "{} is not a regular file",
                child_relative.display()
            )));
        }
    }
    Ok(())
}

fn validate_bundle_root(bundle_root: &Path) -> Result<()> {
    let metadata = fs::symlink_metadata(bundle_root).map_err(|error| {
        BundleError::new(format!(
            "inspect bundle root {}: {error}",
            bundle_root.display()
        ))
    })?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(BundleError::new("bundle root must be a real directory"));
    }
    let mut names = fs::read_dir(bundle_root)
        .map_err(|error| {
            BundleError::new(format!(
                "read bundle root {}: {error}",
                bundle_root.display()
            ))
        })?
        .map(|entry| entry.map(|item| item.file_name().to_string_lossy().into_owned()))
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|error| {
            BundleError::new(format!(
                "read bundle root {}: {error}",
                bundle_root.display()
            ))
        })?;
    names.sort();
    let expected = vec![
        BUNDLE_FILE.to_owned(),
        MANIFEST_FILE.to_owned(),
        COLLECTION_FILE.to_owned(),
        TREE_DIRECTORY.to_owned(),
    ];
    let mut expected_sorted = expected;
    expected_sorted.sort();
    if names != expected_sorted {
        return Err(BundleError::new(format!("bundle root must contain exactly {BUNDLE_FILE}, {MANIFEST_FILE}, {COLLECTION_FILE}, and {TREE_DIRECTORY}/")));
    }
    let tree_metadata = fs::symlink_metadata(bundle_root.join(TREE_DIRECTORY))
        .map_err(|error| BundleError::new(format!("inspect {TREE_DIRECTORY}/: {error}")))?;
    if tree_metadata.file_type().is_symlink() || !tree_metadata.is_dir() {
        return Err(BundleError::new("tree/ must be a real directory"));
    }
    Ok(())
}

fn validate_expectations(
    manifest: &BundleManifest,
    expected: &ValidationExpectations,
) -> Result<()> {
    compare_expected(
        "repository id",
        expected.repository_id.as_deref(),
        &manifest.repository.id,
    )?;
    compare_expected(
        "repository URL",
        expected.repository_url.as_deref(),
        &manifest.repository.url,
    )?;
    compare_expected("commit", expected.commit.as_deref(), &manifest.commit)?;
    if let Some(expected_run_id) = expected.producer_run_id {
        if expected_run_id != manifest.producer.run_id {
            return Err(BundleError::new(format!(
                "producer run id is {}, expected {expected_run_id}",
                manifest.producer.run_id
            )));
        }
    }
    if let Some(expected_artifact_id) = expected.artifact_id {
        if Some(expected_artifact_id) != manifest.producer.artifact_id {
            return Err(BundleError::new(format!(
                "artifact id is {:?}, expected {expected_artifact_id}",
                manifest.producer.artifact_id
            )));
        }
    }
    if let Some(expected_artifact_digest) = expected.artifact_digest.as_deref() {
        if Some(expected_artifact_digest) != manifest.producer.artifact_digest.as_deref() {
            return Err(BundleError::new(format!(
                "artifact digest is {:?}, expected {expected_artifact_digest}",
                manifest.producer.artifact_digest
            )));
        }
    }
    Ok(())
}

fn compare_expected(label: &str, expected: Option<&str>, actual: &str) -> Result<()> {
    if let Some(expected) = expected {
        if expected != actual {
            return Err(BundleError::new(format!(
                "{label} is {actual}, expected {expected}"
            )));
        }
    }
    Ok(())
}

fn validate_repository(id: &str, url: &str) -> Result<()> {
    if !id
        .bytes()
        .next()
        .is_some_and(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit())
        || id
            .bytes()
            .any(|byte| !(byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-'))
    {
        return Err(BundleError::new(format!("repository id is invalid: {id}")));
    }
    let expected = format!("https://github.com/beyond10x/{id}");
    if url != expected {
        return Err(BundleError::new(format!(
            "repository URL is {url}, expected {expected}"
        )));
    }
    Ok(())
}

fn validate_commit(value: &str) -> Result<()> {
    if !is_lower_hex(value, 40) {
        return Err(BundleError::new(
            "commit must be an exact lowercase 40-character Git SHA",
        ));
    }
    Ok(())
}

fn validate_positive_id(value: u64, label: &str) -> Result<()> {
    if value == 0 {
        return Err(BundleError::new(format!("{label} must be positive")));
    }
    Ok(())
}

fn validate_artifact_identity(id: Option<u64>, digest: Option<&str>) -> Result<()> {
    if id.is_some() != digest.is_some() {
        return Err(BundleError::new(
            "artifact id and artifact digest must be supplied together",
        ));
    }
    if let Some(id) = id {
        validate_positive_id(id, "artifact id")?;
    }
    if let Some(digest) = digest {
        if !digest.starts_with("sha256:") || !is_lower_hex(&digest[7..], 64) {
            return Err(BundleError::new(
                "artifact digest must use sha256:<64 lowercase hexadecimal characters>",
            ));
        }
    }
    Ok(())
}

fn validate_sha256(value: &str, label: &str) -> Result<()> {
    if !is_lower_hex(value, 64) {
        return Err(BundleError::new(format!(
            "{label} must be 64 lowercase hexadecimal characters"
        )));
    }
    Ok(())
}

fn is_lower_hex(value: &str, length: usize) -> bool {
    value.len() == length
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn validate_relative_path(value: &str, label: &str) -> Result<()> {
    if value.is_empty()
        || value.starts_with('/')
        || value.contains('\\')
        || value.contains("//")
        || value.contains('\0')
    {
        return Err(BundleError::new(format!(
            "{label} must be a normalized relative POSIX path: {value}"
        )));
    }
    let path = Path::new(value);
    if value
        .split('/')
        .any(|component| component == "." || component == "..")
        || path
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err(BundleError::new(format!(
            "{label} must not contain . or .. segments: {value}"
        )));
    }
    Ok(())
}

fn read_source_file(root: &Path, relative: &str) -> Result<Vec<u8>> {
    validate_relative_path(relative, "source path")?;
    let mut candidate = root.to_path_buf();
    for component in relative.split('/') {
        candidate.push(component);
        let metadata = fs::symlink_metadata(&candidate)
            .map_err(|error| BundleError::new(format!("inspect source {relative}: {error}")))?;
        if metadata.file_type().is_symlink() {
            return Err(BundleError::new(format!(
                "{relative} is a symbolic link; public documentation sources must be regular files"
            )));
        }
    }
    let metadata = fs::metadata(&candidate)
        .map_err(|error| BundleError::new(format!("inspect source {relative}: {error}")))?;
    if !metadata.is_file() {
        return Err(BundleError::new(format!(
            "{relative} is not a regular file"
        )));
    }
    fs::read(&candidate)
        .map_err(|error| BundleError::new(format!("read source {relative}: {error}")))
}

fn read_regular_file(path: &Path, label: &str) -> Result<Vec<u8>> {
    let metadata = fs::symlink_metadata(path).map_err(|error| {
        BundleError::new(format!("inspect {label} {}: {error}", path.display()))
    })?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err(BundleError::new(format!(
            "{label} {} must be a regular file",
            path.display()
        )));
    }
    fs::read(path)
        .map_err(|error| BundleError::new(format!("read {label} {}: {error}", path.display())))
}

fn read_bundle_file(root: &Path, relative: &str) -> Result<Vec<u8>> {
    read_regular_file(&root.join(relative), relative)
}

fn canonical_directory(path: &Path, label: &str) -> Result<PathBuf> {
    let canonical = fs::canonicalize(path).map_err(|error| {
        BundleError::new(format!("resolve {label} {}: {error}", path.display()))
    })?;
    let metadata = fs::metadata(&canonical).map_err(|error| {
        BundleError::new(format!("inspect {label} {}: {error}", canonical.display()))
    })?;
    if !metadata.is_dir() {
        return Err(BundleError::new(format!("{label} must be a directory")));
    }
    Ok(canonical)
}

fn refuse_existing_output(path: &Path) -> Result<()> {
    match fs::symlink_metadata(path) {
        Ok(_) => Err(BundleError::new(format!(
            "output {} already exists; refusing to merge or overwrite a bundle",
            path.display()
        ))),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(BundleError::new(format!(
            "inspect output {}: {error}",
            path.display()
        ))),
    }
}

fn write_file(path: &Path, bytes: &[u8]) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| BundleError::new(format!("create {}: {error}", parent.display())))?;
    }
    fs::write(path, bytes)
        .map_err(|error| BundleError::new(format!("write {}: {error}", path.display())))
}

fn canonical_json<T: Serialize>(value: &T) -> Result<Vec<u8>> {
    let mut bytes = serde_json::to_vec(value)
        .map_err(|error| BundleError::new(format!("serialize canonical JSON: {error}")))?;
    bytes.push(b'\n');
    Ok(bytes)
}

fn compare_digest(label: &str, declared: &str, actual: &str) -> Result<()> {
    if declared != actual {
        return Err(BundleError::new(format!(
            "{label} is {declared}, computed {actual}"
        )));
    }
    Ok(())
}

fn sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn path_from_posix(value: &str) -> PathBuf {
    value.split('/').collect()
}

fn to_posix(path: &Path) -> Result<String> {
    let mut parts = Vec::new();
    for component in path.components() {
        match component {
            Component::Normal(value) => parts.push(
                value
                    .to_str()
                    .ok_or_else(|| {
                        BundleError::new(format!("path is not valid UTF-8: {}", path.display()))
                    })?
                    .to_owned(),
            ),
            _ => {
                return Err(BundleError::new(format!(
                    "path is not relative and normalized: {}",
                    path.display()
                )))
            }
        }
    }
    Ok(parts.join("/"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn source(path: &str, bytes: &[u8]) -> ValidatedSource {
        ValidatedSource {
            file: BundleFile {
                path: path.to_owned(),
                sha256: sha256(bytes),
                size: bytes.len() as u64,
            },
            bytes: bytes.to_vec(),
        }
    }

    #[test]
    fn relative_paths_refuse_escapes_and_non_posix_separators() {
        assert!(validate_relative_path("docs/guide.md", "fixture").is_ok());
        for path in [
            "/absolute.md",
            "../escape.md",
            "docs/../escape.md",
            "docs/./guide.md",
            "docs\\guide.md",
            "docs//guide.md",
        ] {
            assert!(validate_relative_path(path, "fixture").is_err(), "{path}");
        }
    }

    #[test]
    fn change_and_collection_inputs_may_not_overlap() {
        let error = merge_sources(
            vec![source("changes/release.yaml", b"one")],
            vec![source("changes/release.yaml", b"one")],
        )
        .err()
        .expect("overlap must fail");
        assert!(error.to_string().contains("overlaps are not allowed"));
    }
}
