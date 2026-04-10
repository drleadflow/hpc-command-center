import matter from "gray-matter";

const GITHUB_API = "https://api.github.com";
const OWNER = process.env.GITHUB_OWNER || "drleadflow";
const REPO = process.env.GITHUB_REPO || "blade-ops";
const TOKEN = process.env.GITHUB_TOKEN;

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  content: string;
}

interface FrontmatterData {
  [key: string]: any;
}

// Fetch a file from GitHub
async function getFile(path: string): Promise<{ content: string; sha: string } | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return { content, sha: data.sha };
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }
}

// Fetch all files in a directory
async function getDirectory(path: string): Promise<GitHubFile[]> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const files: GitHubFile[] = [];

    for (const item of data) {
      if (item.type === "file" && item.name.endsWith(".md")) {
        const file = await getFile(item.path);
        if (file) {
          files.push({
            name: item.name,
            path: item.path,
            sha: file.sha,
            content: file.content,
          });
        }
      }
    }

    return files;
  } catch (error) {
    console.error(`Error fetching directory ${path}:`, error);
    return [];
  }
}

// Create or update a file
async function upsertFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<boolean> {
  try {
    const body: any = {
      message,
      content: Buffer.from(content).toString("base64"),
      branch: "main",
    };

    if (sha) {
      body.sha = sha;
    }

    const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (error) {
    console.error(`Error upserting ${path}:`, error);
    return false;
  }
}

// Delete a file
async function deleteFile(path: string, message: string, sha: string): Promise<boolean> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        sha,
        branch: "main",
      }),
    });

    return res.ok;
  } catch (error) {
    console.error(`Error deleting ${path}:`, error);
    return false;
  }
}

// Parse markdown file with frontmatter
function parseFile<T extends FrontmatterData>(file: GitHubFile): (T & { content: string; _sha: string; _path: string }) | null {
  try {
    const { data, content } = matter(file.content);
    return {
      ...data,
      content: content.trim(),
      _sha: file.sha,
      _path: file.path,
    } as T & { content: string; _sha: string; _path: string };
  } catch (error) {
    console.error(`Error parsing ${file.path}:`, error);
    return null;
  }
}

// Create markdown file content from data
function createFileContent(frontmatter: FrontmatterData, body: string): string {
  return matter.stringify(body, frontmatter);
}

// Slugify a string for filename
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export {
  getFile,
  getDirectory,
  upsertFile,
  deleteFile,
  parseFile,
  createFileContent,
  slugify,
};
