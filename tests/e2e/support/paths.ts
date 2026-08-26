import path from "node:path";

export const artifactRoot = path.join(process.cwd(), ".artifacts");
export const authArtifactRoot = path.join(artifactRoot, "auth");
export const performanceArtifactRoot = path.join(artifactRoot, "performance");
export const screenshotArtifactRoot = path.join(artifactRoot, "screenshots");

export const credentialFile = path.join(authArtifactRoot, "credentials.json");

export const storageStateFiles = {
  owner: path.join(authArtifactRoot, "owner.json"),
  member: path.join(authArtifactRoot, "member.json"),
  "arabic-owner": path.join(authArtifactRoot, "arabic-owner.json"),
} as const;

export type TestRole = keyof typeof storageStateFiles;
