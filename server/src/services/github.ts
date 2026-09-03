import { Octokit } from "@octokit/rest";

const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    "coverage",
    ".next",
    "vendor",
    "target",
    "__pycache__",
    ".gradle",
]);

const SKIP_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "bmp",
    "woff", "woff2", "ttf", "eot", "otf",
    "mp3", "mp4", "mov", "wav", "webm",
    "exe", "dll", "so", "dylib", "bin", "wasm",
    "class", "jar", "war", "ear",
    "zip", "tar", "gz", "tgz", "7z", "rar",
    "pdf", "lock", "map",
]);

const SKIP_FILES = new Set([
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "composer.lock",
    "go.sum",
]);

type RepoFile = {
    path: string;
    content: string;
};

const MAX_FILE_SIZE = 200_000;

export function parseRepo(input: string): {
    owner: string;
    repo: string;
    repoKey: string;
} {
    const clean = input
        .replace("https://github.com/", "")
        .replace("http://github.com/", "")
        .replace(/\.git$/, "");

    const [owner, repo] = clean.split("/");

    if (!owner || !repo) {
        throw new Error("Invalid GitHub repository URL");
    }

    return {
        owner,
        repo,
        repoKey: `${owner}/${repo}`,
    };
}

function shouldSkipFile(path: string, size?: number): boolean {
    const parts = path.split("/");
    const fileName = parts.at(-1);

    if (!fileName) return true;

    if (parts.some((part) => SKIP_DIRS.has(part))) return true;
    if (SKIP_FILES.has(fileName)) return true;
    if (typeof size === "number" && size > MAX_FILE_SIZE) return true;

    const dotIndex = fileName.lastIndexOf(".");

    if (dotIndex > 0) {
        const extension = fileName
            .slice(dotIndex + 1)
            .toLowerCase();

        if (SKIP_EXTENSIONS.has(extension)) return true;

    }
    if (fileName.endsWith(".min.js")) return true;

    return false;
}


export async function fetchRepoFiles(
    token: string,
    owner: string,
    repo: string
): Promise<RepoFile[]> {
    const octokit = new Octokit({ auth: token });

    const { data: repoInfo } = await octokit.rest.repos
        .get({ owner, repo })
        .catch((err) => {
            if (err.status === 404) {
                throw new Error(
                    `GitHub could not find ${owner}/${repo}. Fine-grained tokens (github_pat_) must include this repo.`
                );
            }

            throw err;
        });

    const { data: tree } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: repoInfo.default_branch,
        recursive: "true",
    });

    const files: RepoFile[] = [];

    for (const item of tree.tree) {
        if (item.type !== "blob") continue;
        if (!item.path || shouldSkipFile(item.path, item.size)) continue;

        const { data: blob } = await octokit.rest.git.getBlob({
            owner,
            repo,
            file_sha: item.sha,
        });

        files.push({
            path: item.path,
            content: Buffer.from(blob.content, "base64").toString("utf8"),
        });

        if (files.length >= 200) break;
    }

    return files;
}