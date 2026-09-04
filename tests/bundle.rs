use b10x_docs_bundle::{
    build_bundle, validate_bundle, BuildOptions, ValidationExpectations, BUNDLE_SCHEMA,
};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

const COMMIT: &str = "0123456789abcdef0123456789abcdef01234567";

fn fixture(path: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("fixtures/bundle-v1")
        .join(path)
}

fn options(output: PathBuf) -> BuildOptions {
    BuildOptions {
        repository_root: fixture("repository"),
        collection: fixture("collection.json"),
        output,
        commit: COMMIT.to_owned(),
        producer_run_id: 4242,
        artifact_id: None,
        artifact_digest: None,
    }
}

fn snapshot(root: &Path) -> BTreeMap<String, Vec<u8>> {
    fn visit(root: &Path, directory: &Path, files: &mut BTreeMap<String, Vec<u8>>) {
        let mut entries = fs::read_dir(directory)
            .unwrap()
            .map(|entry| entry.unwrap())
            .collect::<Vec<_>>();
        entries.sort_by_key(|entry| entry.file_name());
        for entry in entries {
            if entry.file_type().unwrap().is_dir() {
                visit(root, &entry.path(), files);
            } else {
                let relative = entry
                    .path()
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/");
                files.insert(relative, fs::read(entry.path()).unwrap());
            }
        }
    }
    let mut files = BTreeMap::new();
    visit(root, root, &mut files);
    files
}

#[test]
fn builds_byte_identical_bundles_with_collection_and_changes() {
    let temporary = tempfile::tempdir().unwrap();
    let first = temporary.path().join("first");
    let second = temporary.path().join("second");
    let first_manifest = build_bundle(&options(first.clone())).unwrap();
    let second_manifest = build_bundle(&options(second.clone())).unwrap();

    assert_eq!(first_manifest, second_manifest);
    assert_eq!(snapshot(&first), snapshot(&second));
    assert_eq!(first_manifest.schema, BUNDLE_SCHEMA);
    assert_eq!(
        first_manifest
            .files
            .iter()
            .map(|file| file.path.as_str())
            .collect::<Vec<_>>(),
        vec!["changes/fixture.yaml", "docs/guide.md",]
    );
    assert_eq!(
        snapshot(&first)
            .keys()
            .map(String::as_str)
            .collect::<Vec<_>>(),
        vec![
            "b10x.docs.yaml",
            "bundle.json",
            "collection.json",
            "tree/changes/fixture.yaml",
            "tree/docs/guide.md",
        ]
    );

    let validated = validate_bundle(
        &first,
        &ValidationExpectations {
            repository_id: Some("fixture".to_owned()),
            repository_url: Some("https://github.com/beyond10x/fixture".to_owned()),
            commit: Some(COMMIT.to_owned()),
            producer_run_id: Some(4242),
            ..ValidationExpectations::default()
        },
    )
    .unwrap();
    assert_eq!(validated, first_manifest);
}

#[test]
fn validation_refuses_source_manifest_collection_and_identity_drift() {
    let temporary = tempfile::tempdir().unwrap();

    let source_drift = temporary.path().join("source-drift");
    build_bundle(&options(source_drift.clone())).unwrap();
    fs::write(source_drift.join("tree/docs/guide.md"), b"changed\n").unwrap();
    assert!(
        validate_bundle(&source_drift, &ValidationExpectations::default())
            .unwrap_err()
            .to_string()
            .contains("size is")
    );

    let manifest_drift = temporary.path().join("manifest-drift");
    build_bundle(&options(manifest_drift.clone())).unwrap();
    fs::write(manifest_drift.join("b10x.docs.yaml"), b"schema: b10x-docs/v3\nrepository: {id: fixture, url: https://github.com/beyond10x/fixture}\n").unwrap();
    assert!(
        validate_bundle(&manifest_drift, &ValidationExpectations::default())
            .unwrap_err()
            .to_string()
            .contains("manifestSha256")
    );

    let collection_drift = temporary.path().join("collection-drift");
    build_bundle(&options(collection_drift.clone())).unwrap();
    let mut bytes = fs::read(collection_drift.join("collection.json")).unwrap();
    bytes.push(b'\n');
    fs::write(collection_drift.join("collection.json"), bytes).unwrap();
    assert!(
        validate_bundle(&collection_drift, &ValidationExpectations::default())
            .unwrap_err()
            .to_string()
            .contains("collectionSha256")
    );

    let identity = temporary.path().join("identity");
    build_bundle(&options(identity.clone())).unwrap();
    let error = validate_bundle(
        &identity,
        &ValidationExpectations {
            repository_id: Some("another".to_owned()),
            ..ValidationExpectations::default()
        },
    )
    .unwrap_err();
    assert!(error
        .to_string()
        .contains("repository id is fixture, expected another"));
}

#[test]
fn validation_refuses_noncanonical_versions_and_unlisted_tree_bytes() {
    let temporary = tempfile::tempdir().unwrap();
    let unsupported = temporary.path().join("unsupported");
    build_bundle(&options(unsupported.clone())).unwrap();
    let mut manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(unsupported.join("bundle.json")).unwrap()).unwrap();
    manifest["schema"] = serde_json::Value::String("b10x-docs-bundle/v2".to_owned());
    let mut bytes = serde_json::to_vec(&manifest).unwrap();
    bytes.push(b'\n');
    fs::write(unsupported.join("bundle.json"), bytes).unwrap();
    let error = validate_bundle(&unsupported, &ValidationExpectations::default()).unwrap_err();
    assert!(error
        .to_string()
        .contains("consumers must add support before producers emit a new version"));

    let extra = temporary.path().join("extra");
    build_bundle(&options(extra.clone())).unwrap();
    fs::write(extra.join("tree/unlisted.md"), b"not indexed\n").unwrap();
    assert!(validate_bundle(&extra, &ValidationExpectations::default())
        .unwrap_err()
        .to_string()
        .contains("unlisted"));

    let traversal = temporary.path().join("traversal");
    build_bundle(&options(traversal.clone())).unwrap();
    let mut manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(traversal.join("bundle.json")).unwrap()).unwrap();
    manifest["files"][0]["path"] = serde_json::Value::String("../escape.yaml".to_owned());
    let mut bytes = serde_json::to_vec(&manifest).unwrap();
    bytes.push(b'\n');
    fs::write(traversal.join("bundle.json"), bytes).unwrap();
    assert!(
        validate_bundle(&traversal, &ValidationExpectations::default())
            .unwrap_err()
            .to_string()
            .contains("must not contain . or ..")
    );

    let change_schema = temporary.path().join("change-schema");
    build_bundle(&options(change_schema.clone())).unwrap();
    fs::write(
        change_schema.join("tree/changes/fixture.yaml"),
        b"schema: executable-change/v1\n",
    )
    .unwrap();
    assert!(
        validate_bundle(&change_schema, &ValidationExpectations::default())
            .unwrap_err()
            .to_string()
            .contains("must use b10x-change/v1 or b10x-change/v2")
    );
}

#[test]
fn build_requires_paired_artifact_provenance_and_a_new_output() {
    let temporary = tempfile::tempdir().unwrap();
    let output = temporary.path().join("bundle");
    let mut invalid = options(output.clone());
    invalid.artifact_id = Some(7);
    assert!(build_bundle(&invalid)
        .unwrap_err()
        .to_string()
        .contains("supplied together"));

    build_bundle(&options(output.clone())).unwrap();
    assert!(build_bundle(&options(output))
        .unwrap_err()
        .to_string()
        .contains("refusing to merge or overwrite"));

    let artifact_output = temporary.path().join("artifact-bundle");
    let mut artifact = options(artifact_output.clone());
    artifact.artifact_id = Some(17);
    artifact.artifact_digest = Some(format!("sha256:{}", "a".repeat(64)));
    build_bundle(&artifact).unwrap();
    validate_bundle(
        &artifact_output,
        &ValidationExpectations {
            artifact_id: Some(17),
            artifact_digest: Some(format!("sha256:{}", "a".repeat(64))),
            ..ValidationExpectations::default()
        },
    )
    .unwrap();
}

#[cfg(unix)]
#[test]
fn build_refuses_symbolic_link_sources_and_changes() {
    use std::os::unix::fs::symlink;

    let temporary = tempfile::tempdir().unwrap();
    let repository = temporary.path().join("repository");
    fs::create_dir_all(repository.join("docs")).unwrap();
    fs::copy(
        fixture("repository/b10x.docs.yaml"),
        repository.join("b10x.docs.yaml"),
    )
    .unwrap();
    symlink(
        fixture("repository/docs/guide.md"),
        repository.join("docs/guide.md"),
    )
    .unwrap();
    let mut invalid = options(temporary.path().join("bundle"));
    invalid.repository_root = repository;
    assert!(build_bundle(&invalid)
        .unwrap_err()
        .to_string()
        .contains("symbolic link"));

    let repository = temporary.path().join("change-repository");
    fs::create_dir_all(&repository).unwrap();
    fs::copy(
        fixture("repository/b10x.docs.yaml"),
        repository.join("b10x.docs.yaml"),
    )
    .unwrap();
    fs::create_dir_all(repository.join("docs")).unwrap();
    fs::copy(
        fixture("repository/docs/guide.md"),
        repository.join("docs/guide.md"),
    )
    .unwrap();
    symlink(fixture("repository/changes"), repository.join("changes")).unwrap();
    let mut invalid = options(temporary.path().join("change-bundle"));
    invalid.repository_root = repository;
    assert!(build_bundle(&invalid)
        .unwrap_err()
        .to_string()
        .contains("changes/ must be a real directory"));
}
