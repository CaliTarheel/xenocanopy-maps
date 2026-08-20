import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Xenocanopy encounter builder", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Xenocanopy/);
  assert.match(html, /Make the jungle/);
  assert.match(html, /Roll20-ready export/);
  assert.match(html, /Player PNG/);
  assert.match(html, /GM overlay/);
  assert.match(html, /og:image/);
  assert.match(html, /Stephen G\. Rider/);
  assert.match(html, /mailto:rider\.sg@gmail\.com/);
  assert.match(html, /github\.com\/CaliTarheel\/xenocanopy-maps/);
  assert.match(html, /MIT licensed/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("removes all disposable starter surfaces", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Xenocanopy/);
  assert.match(page, /downloadCanvas/);
  assert.match(layout, /Alien Jungle Battlemap Generator/);
  assert.doesNotMatch(`${page}${layout}${packageJson}`, /codex-preview|react-loading-skeleton|_sites-preview/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
