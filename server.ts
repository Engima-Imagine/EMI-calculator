import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  app.post('/api/insights', async (req, res) => {
    try {
      const { inputs, summary } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Construct a prompt specifically asking for a tailored tip based on the inputs
      const prompt = `You are an expert financial advisor specializing in home loans. 
The user is viewing a mortgage repayment monitor and needs a tailored strategy tip.

User's Loan Configuration:
- Principal Loan Amount: ₹${inputs.principal}
- Interest Rate: ${inputs.interestRate}%
- Loan Term: ${inputs.loanTermYears} years
- Current Recurring Extra Repayment Strategy: ₹${inputs.extraRepayment} paid ${inputs.extraRepaymentFrequency}
- Current Lump Sum Strategy: ₹${inputs.lumpSumAmount} paid at month ${inputs.lumpSumMonth}

With this strategy, the user saves ₹${summary.interestSaved} in interest and pays off their loan ${summary.timeSavedMonths} months early.

Task:
Provide exactly 2 short sentences of insightful, tailored advice. 
Do NOT mention the exact numbers they just gave you back to them. Focus on the *strategy*.
For example: suggest optimizing their frequency (e.g. fortnightly over monthly), highlight if the lump sum is highly effective or if a recurring increase would be better, or warn them if their extra payments are barely making a dent.
Keep it casual, encouraging, and highly specific to their current configuration. No markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ insight: response.text });
    } catch (error) {
      console.error('Error generating insight:', error);
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Static serving for production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
