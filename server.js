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
    page.setDefaultTimeout(20000);

    await page.goto("https://www.mahakim.ma/#/suivi/dossier-suivi", {
      waitUntil: "domcontentloaded",
      timeout: 120000
    }).catch(() => {});

    await page.waitForTimeout(10000);

    const inputs = await page.locator("input").count();

    if (inputs === 0) {
      const bodyText = await page.locator("body").innerText();
      return res.json({
        success: false,
        error: "No inputs found",
        preview: bodyText.slice(0, 1000)
      });
    }

    await page.locator("input").first().fill(String(full_case_number));
    await page.waitForTimeout(2000);

    if (appeal_court) {
      await page.getByText("اختيار محكمة الاستئناف").click().catch(() => {});
      await page.waitForTimeout(1000);
      await page.getByText(String(appeal_court), { exact: true }).click().catch(() => {});
      await page.waitForTimeout(2000);
    }

    const shouldSearchPrimary =
      search_primary === true ||
      String(search_primary).toLowerCase() === "true";

    if (shouldSearchPrimary) {
      await page.getByText("هل تريد البحث بالمحاكم الابتدائية").click().catch(() => {});
      await page.waitForTimeout(2000);

      if (primary_court) {
        await page.getByText("اختيار المحكمة الابتدائية").click().catch(() => {});
        await page.waitForTimeout(1000);
        await page.getByText(String(primary_court), { exact: true }).click().catch(() => {});
        await page.waitForTimeout(2000);
      }
    }

    await page.getByText("بحث").last().click();
    await page.waitForTimeout(8000);

    const result = await page.locator("body").innerText();

    return res.json({
      success: true,
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
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
