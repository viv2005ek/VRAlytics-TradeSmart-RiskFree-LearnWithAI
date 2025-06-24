deployed at "https://lingoapi.onrender.com"

const express = require("express");
const cors = require("cors");
const { LingoDotDevEngine } = require("lingo.dev/sdk");

// Initialize Express
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Initialize Lingo SDK
const lingo = new LingoDotDevEngine({
  apiKey: "api_pm1eltg99qigo1cjmv1pcv7q",
  batchSize: 10, // Smaller batches for testing
});

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", server: "Lingo Translation API" });
});

// Text Translation Endpoint
app.post("/translate", async (req, res) => {
  try {
    const { text, sourceLocale, targetLocale, fast = true } = req.body;

    // Validate input
    if (!text || !sourceLocale || !targetLocale) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Translate using Lingo SDK
    const translation = await lingo.localizeText(text, {
      sourceLocale,
      targetLocale,
      fast,
    });

    res.json({ translation });
  } catch (error) {
    console.error("Translation error:", error.message);
    res.status(500).json({ error: "Translation failed" });
  }
});

// Object Translation Endpoint
app.post("/translate-object", async (req, res) => {
  try {
    const { data, sourceLocale, targetLocale } = req.body;

    if (!data || !sourceLocale || !targetLocale) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const translated = await lingo.localizeObject(data, {
      sourceLocale,
      targetLocale,
    });

    res.json({ translated });
  } catch (error) {
    console.error("Object translation error:", error);
    res.status(500).json({ error: "Object translation failed" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});