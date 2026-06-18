import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Midtrans Snap Token
  app.post("/api/midtrans/token", async (req, res) => {
    try {
      const { studentId, studentNis, studentNama, amount, months, parentPhone, customServerKey, customClientKey } = req.body;
      
      const serverKey = customServerKey || process.env.MIDTRANS_SERVER_KEY;
      const orderId = `order-spp-${Date.now()}-${studentNis}`;

      if (!serverKey) {
        // Return simulated snapshot response gracefully
        return res.json({
          success: true,
          token: `simulated_snap_token_${Date.now()}_${studentNis}`,
          redirect_url: "#",
          isSimulated: true,
          orderId,
          clientKey: customClientKey || process.env.VITE_MIDTRANS_CLIENT_KEY || "SB-Mid-client-mock"
        });
      }

      // Encode Basic Auth using standard modern node buffer
      const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

      // Check key style to automatically determine if sandbox or production endpoint
      const isProd = !serverKey.startsWith("SB-");
      const url = isProd
        ? "https://app.midtrans.com/snap/v1/transactions"
        : "https://app.sandbox.midtrans.com/snap/v1/transactions";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: Number(amount)
          },
          customer_details: {
            first_name: studentNama,
            last_name: `(NIS: ${studentNis})`,
            phone: parentPhone || ""
          },
          item_details: months.map((m: string) => ({
            id: `spp-${m.replace(/\s+/g, "_")}`,
            price: Number(amount) / months.length,
            quantity: 1,
            name: `SPP ${m}`
          }))
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Midtrans API responded with ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return res.json({
        success: true,
        token: data.token,
        redirect_url: data.redirect_url,
        isSimulated: false,
        orderId,
        clientKey: customClientKey || process.env.VITE_MIDTRANS_CLIENT_KEY || ""
      });

    } catch (error: any) {
      console.error("Error creating Midtrans Snap Token:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal membuat token pembayaran Midtrans"
      });
    }
  });

  // API Route: Midtrans Real webhook (optional, for complete integration)
  app.post("/api/midtrans/webhook", (req, res) => {
    const notification = req.body;
    console.log("Midtrans Webhook received Notification:", notification);
    res.status(200).send("OK");
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
