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
    const { full_case_number } = req.body;

    if (!full_case_number) {
      return res.status(400).json({
        success: false,
        error: "full_case_number is missing"
      });
    }

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto("https://www.mahakim.ma/#/suivi/dossier-suivi", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    const inputs = await page.locator("input").count();

    await page.locator("input").first().fill(String(full_case_number));

    await page.waitForTimeout(2000);

    const beforeClick = await page.locator("body").innerText();

    return res.json({
      success: true,
      step: "filled_only_no_click",
      inputs_found: inputs,
      full_case_number,
      text_preview: beforeClick.slice(0, 1500)
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
