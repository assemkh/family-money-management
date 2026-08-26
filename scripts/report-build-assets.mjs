import { gzipSync } from "node:zlib";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const nextRoot = path.join(projectRoot, ".next");
const outputRoot = path.join(projectRoot, ".artifacts", "bundle");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return files.flat();
}

async function assetSize(relativeAsset) {
  const normalized = relativeAsset.replace(/^\/?_next\//, "");
  const absoluteAsset = path.join(nextRoot, normalized);
  const contents = await readFile(absoluteAsset);
  return {
    asset: normalized,
    gzipBytes: gzipSync(contents).byteLength,
    rawBytes: contents.byteLength,
  };
}

function routeFromManifest(source) {
  const match = source.match(/__RSC_MANIFEST\["([^"]+)"\]\s*=\s*(\{.*\});?\s*$/s);
  if (!match) throw new Error("A client reference manifest had an unknown format.");
  return { route: match[1], manifest: JSON.parse(match[2]) };
}

function displayRoute(route) {
  const withoutPage = route.replace(/\/page$/, "");
  return withoutPage || "/";
}

async function collectRouteAssets() {
  const appRoot = path.join(nextRoot, "server", "app");
  const files = (await walk(appRoot)).filter((file) =>
    file.endsWith("_client-reference-manifest.js"),
  );

  return Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, "utf8");
      const { route, manifest } = routeFromManifest(source);
      const chunks = new Set();

      for (const clientModule of Object.values(manifest.clientModules ?? {})) {
        for (const chunk of clientModule.chunks ?? []) chunks.add(chunk);
      }

      const assets = await Promise.all([...chunks].sort().map(assetSize));
      return {
        route: displayRoute(route),
        assets,
        gzipBytes: assets.reduce((total, asset) => total + asset.gzipBytes, 0),
        rawBytes: assets.reduce((total, asset) => total + asset.rawBytes, 0),
      };
    }),
  );
}

async function collectFonts() {
  const manifestPath = path.join(nextRoot, "server", "next-font-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const uniqueFonts = [...new Set(Object.values(manifest.app ?? {}).flat())].sort();

  return Promise.all(
    uniqueFonts.map(async (asset) => {
      // The manifest lives under .next/server, while emitted font files are
      // rooted at .next/static.
      const absoluteAsset = path.join(nextRoot, asset);
      const contents = await readFile(absoluteAsset);
      return {
        asset,
        // WOFF2 is already compressed; gzip is retained for consistent reporting.
        gzipBytes: gzipSync(contents).byteLength,
        rawBytes: contents.byteLength,
      };
    }),
  );
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function markdownReport(report) {
  const routeRows = report.routes
    .map(
      (route) =>
        `| \`${route.route}\` | ${route.assets.length} | ${kib(route.rawBytes)} | ${kib(route.gzipBytes)} |`,
    )
    .join("\n");
  const fontRows = report.fonts
    .map(
      (font) =>
        `| \`${font.asset.replace("static/media/", "")}\` | ${kib(font.rawBytes)} | ${kib(font.gzipBytes)} |`,
    )
    .join("\n");

  return `# Build Asset Report

Generated: ${report.generatedAt}

The route figures are deduplicated client chunks referenced by each App Router client-reference manifest. They are a stable comparison baseline, not a substitute for browser transferred-byte measurements.

## Client JavaScript by route

| Route | Chunks | Raw | Gzip |
| --- | ---: | ---: | ---: |
${routeRows}

## Font assets

| Font asset | Raw | Gzip |
| --- | ---: | ---: |
${fontRows}
`;
}

async function main() {
  await stat(path.join(nextRoot, "BUILD_ID")).catch(() => {
    throw new Error("Run `npm run build` before generating the asset report.");
  });

  const routes = (await collectRouteAssets()).sort((left, right) =>
    left.route.localeCompare(right.route),
  );
  const fonts = await collectFonts();
  const report = {
    generatedAt: new Date().toISOString(),
    routes,
    fonts,
    uniqueFontRawBytes: fonts.reduce((total, font) => total + font.rawBytes, 0),
  };

  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    path.join(outputRoot, "build-assets.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(path.join(outputRoot, "build-assets.md"), markdownReport(report));
  console.info(
    `Build asset report written to ${path.relative(projectRoot, outputRoot)}.`,
  );
}

await main();
