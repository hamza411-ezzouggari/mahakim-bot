const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/check-case", async (req, res) => {
  const { file_number, file_code, year, court } = req.body;

  const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

  const page = await browser.newPage();

  try {
    await page.goto("https://www.mahakim.ma/#/suivi/dossier-suivi");

    await page.waitForTimeout(5000);

    return res.json({
      success: true,
      message: "Mahakim opened",
      data: {
        file_number,
        file_code,
        year,
        court
      }
    });

  } catch (e) {
    return res.json({
      success: false,
      error: e.message
    });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
