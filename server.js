const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mahakim Bot Running OK");
});

app.post("/check-case", async (req, res) => {
  let browser;

  try {
    const {
      full_case_number,
      appeal_court,
      search_primary,
      primary_court
    } = req.body;

    if (!full_case_number) {
      return res.json({ success: false, error: "full_case_number is missing" });
    }

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    let loaded = false;

    for (let i = 1; i <= 3; i++) {
      try {
        await page.goto("https://www.mahakim.ma/#/suivi/dossier-suivi", {
          waitUntil: "domcontentloaded",
          timeout: 45000
        });

        await page.waitForSelector("input", { timeout: 30000 });
        loaded = true;
        break;
      } catch (e) {
        if (i === 3) {
          const bodyText = await page.locator("body").innerText().catch(() => "");
          return res.json({
            success: false,
            error: "Page did not load inputs after 3 tries",
            last_error: e.message,
            preview: bodyText.slice(0, 1000)
          });
        }

        await page.waitForTimeout(3000);
      }
    }

    const inputs = await page.locator("input").count();

    await page.locator("input").first().fill(String(full_case_number));
    await page.waitForTimeout(1500);

    let steps = ["filled_case_number"];

    if (appeal_court) {
      await page.getByText("اختيار محكمة الاستئناف").click({ timeout: 8000 }).catch(() => {
        steps.push("appeal_dropdown_click_failed");
      });

      await page.waitForTimeout(1500);

      await page.getByText(String(appeal_court), { exact: true }).click({ timeout: 8000 }).catch(() => {
        steps.push("appeal_select_failed");
      });

      steps.push("appeal_attempt_done");
      await page.waitForTimeout(1500);
    }

    const shouldSearchPrimary =
      search_primary === true ||
      String(search_primary).toLowerCase() === "true";

    if (shouldSearchPrimary) {
      await page.getByText("هل تريد البحث بالمحاكم الابتدائية").click({ timeout: 8000 }).catch(() => {
        steps.push("primary_checkbox_click_failed");
      });

      steps.push("primary_checkbox_attempt_done");
      await page.waitForTimeout(1500);

      if (primary_court) {
        await page.getByText("اختيار المحكمة الابتدائية").click({ timeout: 8000 }).catch(() => {
          steps.push("primary_dropdown_click_failed");
        });

        await page.waitForTimeout(1500);

        await page.getByText(String(primary_court), { exact: true }).click({ timeout: 8000 }).catch(() => {
          steps.push("primary_select_failed");
        });

        steps.push("primary_attempt_done");
        await page.waitForTimeout(1500);
      }
    }

    await page.getByText("بحث").last().click({ timeout: 8000 }).catch(() => {
      steps.push("search_click_failed");
    });

    await page.waitForTimeout(5000);

    const result = await page.locator("body").innerText().catch(() => "");

    return res.json({
      success: true,
      loaded,
      steps,
      inputs_found: inputs,
      full_case_number,
      appeal_court,
      search_primary,
      primary_court,
      result_preview: result.slice(0, 3000)
    });

  } catch (error) {
    return res.json({
      success: false,
      error: error.message
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
