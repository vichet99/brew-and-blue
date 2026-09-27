// Browser test of the live workflow against a local Supabase stack (see supabase/README.md).
// Needs: the stack running with checks/local_test_users.sh applied, and the site built and
// started with the local URL and publishable key on port 3100.
import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const results = [];
const ok = (name, cond, extra = "") => { results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };

const browser = await chromium.launch();

async function signIn(email, password) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => results.push(`PAGEERROR ${email}: ${e.message}`));
  await page.goto(BASE + "/signin");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL(BASE + "/", { timeout: 15000 });
  await page.waitForSelector(".site-header__meta >> text=Signed in as", { timeout: 15000 });
  return { ctx, page };
}

async function fillReport(page) {
  const groups = await page.$$("fieldset.ind-group");
  for (const g of groups) {
    const id = (await g.getAttribute("id")).slice(2);
    const sel = await g.$(`select#v-${id}`);
    if (sel) await sel.selectOption("completed");
    else {
      const hint = await g.innerText();
      const val = /percent|%/i.test(hint) ? "50" : "3";
      await page.fill(`#v-${id}`, val);
    }
    await page.fill(`#n-${id}`, `Test narrative for ${id}`);
  }
  return groups.length;
}

// 1. Wrong password
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(BASE + "/signin");
  await page.fill("#email", "focal@example.org"); await page.fill("#password", "wrong-password");
  await page.click("button[type=submit]");
  ok("wrong password is refused", await page.waitForSelector("text=The email or password is not right", { timeout: 10000 }).then(() => true, () => false));
  await ctx.close();
}

// 2. Focal point
{
  const { ctx, page } = await signIn("focal@example.org", "Test-focal-2026!");
  const header = await page.innerText(".site-header__meta");
  ok("focal header shows name and role", /Test MAFF Focal/.test(header) && /focal point/i.test(header), header.replace(/\s+/g, " "));
  await page.goto(BASE + "/submissions");
  const rows = await page.$$eval("table tbody tr", (trs) => trs.map((t) => t.innerText.split("\t")[0]));
  ok("focal sees only MAFF submissions", rows.length === 1 && /RY2025-MAFF/.test(rows[0]), JSON.stringify(rows));
  ok("live tag shown", await page.isVisible("text=Records from the database"));
  const nbc = await page.goto(BASE + "/reviews/RY2025-NBC");
  ok("focal cannot open another ministry's report", nbc.status() === 404, `status ${nbc.status()}`);

  await page.goto(BASE + "/collect/cashew-indicator-report");
  ok("form locked to MAFF, year 2026", (await page.inputValue("#f-ministry")) === "maff" && (await page.inputValue("#f-year")) === "2026");
  const n = await fillReport(page);
  await page.click("text=Save draft");
  ok("draft saved to database", await page.waitForSelector("text=Saved to the database", { timeout: 15000 }).then(() => true, () => false), `${n} indicators`);
  await page.waitForSelector("text=Draft saved in the database", { timeout: 15000 }).catch(() => {});
  // values survive a reload
  await page.reload();
  const v = await page.inputValue("#n-Indicator_001").catch(() => "");
  ok("draft answers reload from database", v === "Test narrative for Indicator_001", v);
  await page.click("button:has-text('Submit annual report')");
  const receipt = await page.waitForSelector("text=Annual report submitted", { timeout: 20000 }).then(() => page.innerText(".notice--success"), () => "");
  ok("focal submits RY2026-MAFF", /RY2026-MAFF r1/.test(receipt), receipt.split("\n")[1] ?? "");
  // corrections to approved 2025 report
  await page.goto(BASE + "/collect/cashew-indicator-report?ministry=maff&year=2025");
  ok("approved 2025 report is read-only", await page.isVisible("text=This revision is locked"));
  await page.click("button:has-text('Start a correction')");
  ok("correction opens draft revision 2", await page.waitForSelector("text=revision 2", { timeout: 15000 }).then(() => true, () => false));
  await page.goto(BASE + "/signin");
  await page.click(".site-header__meta >> text=Sign out");
  ok("sign out returns to demo header", await page.waitForSelector(".site-header__meta >> text=Sign in", { timeout: 10000 }).then(() => true, () => false));
  await ctx.close();
}

// 3. Secretariat lead (admin + reviewer)
{
  const { ctx, page } = await signIn("lead@example.org", "Test-lead-2026!");
  await page.goto(BASE + "/reviews");
  ok("lead sees RY2026-MAFF waiting", await page.isVisible("text=Verify MAFF (RY2026-MAFF)"));
  await page.goto(BASE + "/reviews/RY2026-MAFF");
  for (const c of await page.$$("aside fieldset input[type=checkbox]")) await c.check();
  await page.click("aside button:has-text('Approve')");
  await page.click("aside button:has-text('Confirm approve')");
  ok("lead approves the focal point's report", await page.waitForSelector("text=Review history", { timeout: 15000 }).then(async () => {
    await page.waitForSelector("li:has-text('Approved by Test Lead')", { timeout: 15000 });
    return true;
  }, () => false));

  // lead enters NBC 2026 then cannot approve it
  await page.goto(BASE + "/collect/cashew-indicator-report?ministry=nbc&year=2026");
  await fillReport(page);
  await page.click("button:has-text('Submit annual report')");
  await page.waitForSelector("text=Annual report submitted", { timeout: 20000 });
  await page.goto(BASE + "/reviews/RY2026-NBC");
  ok("self-entered warning shown", await page.isVisible("text=You entered this revision"));
  for (const c of await page.$$("aside fieldset input[type=checkbox]")) await c.check();
  await page.click("aside button:has-text('Approve')");
  await page.click("aside button:has-text('Confirm approve')");
  const err = await page.waitForSelector("aside .error-message", { timeout: 10000 }).then((e) => e.innerText(), () => "");
  ok("lead cannot approve own entry", /entered|yourself/i.test(err), err);
  await ctx.close();
}

// 4. Second reviewer returns NBC with a query
{
  const { ctx, page } = await signIn("reviewer@example.org", "Test-reviewer-2026!");
  await page.goto(BASE + "/reviews/RY2026-NBC");
  await page.click("aside button:has-text('Return')");
  await page.fill("#reason", "Please attach the NBC loan statistics for 2026.");
  await page.click("aside button:has-text('Confirm return')");
  ok("reviewer returns NBC with a query", await page.waitForSelector("li:has-text('Returned by Test Reviewer')", { timeout: 15000 }).then(() => true, () => false));
  await page.goto(BASE + "/admin");
  ok("reviewer is refused the admin page", await page.waitForSelector("text=You don't have access to this page", { timeout: 10000 }).then(() => true, () => false));
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
if (results.some((r) => !r.startsWith("PASS"))) process.exit(1);
