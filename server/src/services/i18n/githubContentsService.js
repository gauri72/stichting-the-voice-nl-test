import env from "../../config/env.js";

const API_BASE = "https://api.github.com";

function repoPath(path) {
  const { owner, repo } = env.githubContents;
  return `${API_BASE}/repos/${owner}/${repo}/contents/${path}`;
}

function assertConfigured() {
  if (!env.githubContents.token) {
    throw new Error("GITHUB_CONTENTS_TOKEN is not set — cannot write to the repo.");
  }
}

function authHeaders() {
  return {
    Authorization: `Bearer ${env.githubContents.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Fetches a repo file's current content (UTF-8 decoded) and its blob sha. */
export async function getFileContent(path) {
  assertConfigured();
  const response = await fetch(`${repoPath(path)}?ref=main`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`GitHub Contents API GET ${path} failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  const content = Buffer.from(body.content, body.encoding || "base64").toString("utf8");
  return { content, sha: body.sha };
}

/** Writes new content to a repo file, creating a commit on main. */
export async function updateFileContent(path, newContent, message) {
  assertConfigured();
  const { sha } = await getFileContent(path);
  const response = await fetch(repoPath(path), {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(newContent, "utf8").toString("base64"),
      sha,
      branch: "main",
    }),
  });
  if (!response.ok) {
    throw new Error(`GitHub Contents API PUT ${path} failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  return { commitSha: body.commit?.sha || "" };
}
