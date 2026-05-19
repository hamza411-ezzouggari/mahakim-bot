app.post("/check-case", async (req, res) => {
  let browser;

  try {
    const { full_case_number } = req.body;

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(
      "https://www.mahakim.ma/#/suivi/dossier-suivi",
      { waitUntil: "networkidle" }
    );

    await page.waitForTimeout(5000);

    // دخل الرقم
    await page.locator('input').first().fill(full_case_number);

    // ضغط بحث
    await page.getByText("بحث").click();

    await page.waitForTimeout(5000);

    const result = await page.locator("body").innerText();

    res.json({
      success: true,
      result: result.slice(0,2000)
    });

  } catch(error) {
    res.status(500).json({
      success:false,
      error:error.message
    });
  } finally {
    if(browser) await browser.close();
  }
});
