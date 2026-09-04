use b10x_docs_bundle::{build_bundle, validate_bundle, BuildOptions, ValidationExpectations};
use clap::{Args, Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "b10x-docs-bundle",
    about = "Build and validate immutable normalized documentation bundles"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Build a new bundle directory from a validated collection index.
    Build(BuildArgs),
    /// Validate every identity, digest, path, and byte in an existing bundle.
    Validate(ValidateArgs),
}

#[derive(Args)]
struct BuildArgs {
    #[arg(long)]
    repository_root: PathBuf,
    #[arg(long)]
    collection: PathBuf,
    #[arg(long)]
    out: PathBuf,
    #[arg(long)]
    commit: String,
    #[arg(long)]
    producer_run_id: u64,
    #[arg(long, requires = "artifact_digest")]
    artifact_id: Option<u64>,
    #[arg(long, requires = "artifact_id")]
    artifact_digest: Option<String>,
}

#[derive(Args)]
struct ValidateArgs {
    #[arg(long)]
    bundle: PathBuf,
    #[arg(long)]
    repository_id: Option<String>,
    #[arg(long)]
    repository_url: Option<String>,
    #[arg(long)]
    commit: Option<String>,
    #[arg(long)]
    producer_run_id: Option<u64>,
    #[arg(long)]
    artifact_id: Option<u64>,
    #[arg(long)]
    artifact_digest: Option<String>,
}

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

fn run() -> b10x_docs_bundle::Result<()> {
    match Cli::parse().command {
        Command::Build(args) => {
            let output = args.out.clone();
            let manifest = build_bundle(&BuildOptions {
                repository_root: args.repository_root,
                collection: args.collection,
                output: args.out,
                commit: args.commit,
                producer_run_id: args.producer_run_id,
                artifact_id: args.artifact_id,
                artifact_digest: args.artifact_digest,
            })?;
            println!(
                "{}: {} file(s), {}",
                output.display(),
                manifest.files.len(),
                manifest.content_sha256
            );
        }
        Command::Validate(args) => {
            let manifest = validate_bundle(
                &args.bundle,
                &ValidationExpectations {
                    repository_id: args.repository_id,
                    repository_url: args.repository_url,
                    commit: args.commit,
                    producer_run_id: args.producer_run_id,
                    artifact_id: args.artifact_id,
                    artifact_digest: args.artifact_digest,
                },
            )?;
            println!(
                "{}: {} valid, {} file(s), {}",
                args.bundle.display(),
                manifest.schema,
                manifest.files.len(),
                manifest.content_sha256
            );
        }
    }
    Ok(())
}
