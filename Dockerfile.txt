const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mahakim Bot Running");
});

app.post("/check-case", async (req, res) => {
  const { file_number, file_code, year, court } = req.body;

  console.log("Received:", {
    file_number,
    file_code,
    year,
    court
  });

  // غادي نزيدو Playwright الحقيقي فالمرحلة الجاية
  return res.json({
    success: true,
    received: {
      file_number,
      file_code,
      year,
      court
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});