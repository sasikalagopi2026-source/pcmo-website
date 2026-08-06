import { chromium } from "@playwright/test";

const baseUrl = process.env.VERIFY_URL || "http://localhost:8080";

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
const pageErrors = [];

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(err.message));

try {
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  const rootText = await page.evaluate(() => document.getElementById("root")?.innerHTML?.length ?? 0);
  const bodyText = (await page.evaluate(() => document.body.innerText.trim())).slice(0, 300);
  console.log("=== ROOT innerHTML length:", rootText);
  console.log("=== BODY TEXT:", bodyText.replace(/\n/g, " | "));
  console.log("=== CONSOLE ERRORS:", consoleErrors.length ? consoleErrors.join("\n---\n") : "none");
  console.log("=== PAGE ERRORS:", pageErrors.length ? pageErrors.join("\n---\n") : "none");
  // Test a few routes
  for (const route of ["/pages/about", "/pages/webinars", "/login"]) {
    await page.goto(baseUrl + route, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);
    const len = await page.evaluate(() => document.getElementById("root")?.innerHTML?.length ?? 0);
    console.log(`Route ${route}: root innerHTML length = ${len}`);
  }
} catch (err) {
  console.error("=== NAVIGATION ERROR:", err.message);
} finally {
  await browser.close();
}
