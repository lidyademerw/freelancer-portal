import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API Route: Send secure email notification via Resend
  app.post("/api/send-email", async (req, res) => {
    const { 
      to, 
      clientName, 
      taskTitle, 
      taskDescription, 
      dueDate, 
      priority, 
      brandColor = "#6366f1" 
    } = req.body;

    const apiKey = process.env.RESEND_API_KEY;

    console.log(`[Resend Service] Attempting email send for task: "${taskTitle}" to: ${to}`);

    if (!to) {
      res.status(400).json({ error: "Missing recipient email address ('to')" });
      return;
    }

    // Modern HTML email template incorporating the client's saved brand color
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Task Assigned - Sydney.app</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              color: #1e293b;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              background-color: #f8fafc;
              padding: 40px 20px;
              box-sizing: border-box;
            }
            .container {
              max-width: 580px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            }
            .header {
              padding: 32px;
              text-align: center;
              border-bottom: 1px solid #f1f5f9;
            }
            .brand-logo {
              width: 42px;
              height: 42px;
              border-radius: 10px;
              margin: 0 auto 16px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 20px;
              color: #ffffff;
            }
            .body {
              padding: 32px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 0;
              margin-bottom: 8px;
            }
            .message-preview {
              font-size: 14px;
              line-height: 1.6;
              color: #475569;
              margin-bottom: 24px;
            }
            .task-card {
              background-color: #f8fafc;
              border-left: 4px solid ${brandColor};
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 24px;
            }
            .task-title {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 0;
              margin-bottom: 6px;
            }
            .task-desc {
              font-size: 13px;
              line-height: 1.5;
              color: #475569;
              margin-top: 0;
              margin-bottom: 16px;
            }
            .meta-grid {
              display: flex;
              gap: 16px;
              font-size: 12px;
              color: #64748b;
            }
            .meta-item {
              margin-right: 16px;
            }
            .meta-item strong {
              color: #334155;
            }
            .priority-tag {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .priority-high {
              background-color: #fef2f2;
              color: #ef4444;
            }
            .priority-medium {
              background-color: #fffbeb;
              color: #f59e0b;
            }
            .priority-low {
              background-color: #f0fdf4;
              color: #22c55e;
            }
            .button-container {
              text-align: center;
              margin-top: 32px;
              margin-bottom: 16px;
            }
            .action-button {
              display: inline-block;
              background-color: ${brandColor};
              color: #ffffff !important;
              text-decoration: none;
              font-size: 14px;
              font-weight: 600;
              padding: 12px 28px;
              border-radius: 10px;
              transition: opacity 0.2s ease;
            }
            .footer {
              background-color: #f8fafc;
              padding: 24px 32px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
            }
            .footer a {
              color: #64748b;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <div class="brand-logo" style="background-color: ${brandColor};">S</div>
                <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; tracking: 0.05em; color: ${brandColor};">
                  Sydney.app Client Portal
                </div>
              </div>
              <div class="body">
                <p class="greeting">Hi ${clientName},</p>
                <p class="message-preview">
                  A new milestone deliverable has been scoped for your review by your partner freelancer. You can track this task, upload feedback assets, or discuss revision requirements inside your secure client portal.
                </p>
                
                <div class="task-card">
                  <h4 class="task-title">${taskTitle}</h4>
                  ${taskDescription ? `<p class="task-desc">${taskDescription}</p>` : ''}
                  
                  <div class="meta-grid">
                    <div class="meta-item">
                      <strong>Due Date:</strong> ${dueDate}
                    </div>
                    <div class="meta-item">
                      <strong>Priority:</strong> 
                      <span class="priority-tag priority-${priority || 'medium'}">${priority || 'medium'}</span>
                    </div>
                  </div>
                </div>

                <div class="button-container">
                  <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="action-button">
                    Access Client Portal
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>This is a secure automated workspace notification regarding your project.</p>
                <p>&copy; 2026 Sydney Studio Partner Systems. Backed by Supabase Realtime Storage.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!apiKey) {
      // Simulate real successful email send when key is missing so development doesn't break
      console.log(`[Resend Service - SIMULATED SUCCESS]
        ====================================================
        No RESEND_API_KEY provided in secrets!
        We successfully simulated the React Email Template:
        - To: ${to}
        - Client Name: ${clientName}
        - Brand Color: ${brandColor}
        - Subject: "New Task Assigned: ${taskTitle}"
        ====================================================
      `);

      res.status(200).json({
        success: true,
        simulated: true,
        message: "Simulated email sent successfully because RESEND_API_KEY was not configured.",
        details: { to, taskTitle, brandColor }
      });
      return;
    }

    try {
      // Lazy initialization of Resend SDK as per security best practices
      const resend = new Resend(apiKey);
      const emailResult = await resend.emails.send({
        from: "Sydney Portal <onboarding@resend.dev>",
        to: [to],
        subject: `New Task Scope: ${taskTitle}`,
        html: htmlContent,
      });

      console.log("[Resend Service - REAL SUCCESS]", emailResult);
      res.status(200).json({
        success: true,
        simulated: false,
        data: emailResult
      });
    } catch (error: any) {
      console.error("[Resend Service - ERROR]", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send email via Resend"
      });
    }
  });

  // API Route: Generate B2B Chat message responses using Google Gemini
  app.post("/api/gemini/chat", async (req, res) => {
    const { messages, targetRole, clientName, projectTitle } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    console.log(`[Gemini Service] Request for targetRole: "${targetRole}" client: "${clientName}" project: "${projectTitle}"`);

    if (!apiKey) {
      const fallbackReplies = targetRole === 'admin'
        ? [
            `Hi ${clientName}, thanks for the update. I will review this and incorporate it into the design drafts.`,
            `Excellent point! I've added a note to our sprint tracker to discuss this in our sync session.`
          ]
        : [
            "This looks excellent, Alex! Quick question: should we update the invoice details for the next cycle?",
            "Understood, that works perfectly for our roadmap."
          ];
      const randomFallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      res.status(200).json({
        success: true,
        text: randomFallback + " (Simulated fallback)"
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = targetRole === 'admin'
        ? `You are Alex Rivers, a professional software freelancer working with your client, ${clientName}, on the project named "${projectTitle}". Respond to their message directly. Keep your reply highly professional, friendly, supportive, collaborative, and brief (1 to 2 sentences max). Do not use placeholders or write markdown blocks.`
        : `You are ${clientName}, a client working with professional software freelancer Alex Rivers on the project named "${projectTitle}". Respond to their message directly. Keep your reply friendly, collaborative, professional, direct, and brief (1 to 2 sentences max). Do not use placeholders or write markdown blocks.`;

      const chatContents = messages.map((m: any) => {
        const isTarget = targetRole === 'admin' 
          ? (m.sender_id === 'admin-alex') 
          : (m.sender_id !== 'admin-alex');
        
        return {
          role: isTarget ? "model" : "user",
          parts: [{ text: m.content }]
        };
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.status(200).json({
        success: true,
        text: response.text || "I appreciate the update! Let me look into that."
      });
    } catch (error: any) {
      console.error("[Gemini Service - ERROR]", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to query Gemini model"
      });
    }
  });

  // Vite middleware for development or serving compiled files for production
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
    console.log(`[Full-Stack Server] Ready at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Full-Stack Server] Failed to bootstrap", err);
});
