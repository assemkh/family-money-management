import { readFile } from "node:fs/promises";

import { credentialFile, type TestRole } from "./paths";

export type TestCredential = {
  identifier: string;
  password: string;
};

export type TestCredentials = Partial<Record<TestRole, TestCredential>>;

export async function readTestCredentials(): Promise<TestCredentials> {
  try {
    return JSON.parse(await readFile(credentialFile, "utf8")) as TestCredentials;
  } catch {
    return {};
  }
}

export function roleForProject(projectName: string): TestRole | null {
  if (projectName.startsWith("owner-")) return "owner";
  if (projectName.startsWith("member-")) return "member";
  if (projectName.startsWith("arabic-owner-")) return "arabic-owner";
  return null;
}

export async function projectHasCredentials(projectName: string) {
  const role = roleForProject(projectName);
  if (!role) return false;
  const credentials = await readTestCredentials();
  return Boolean(credentials[role]);
}
