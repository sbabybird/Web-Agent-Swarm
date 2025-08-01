const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL;

app.use(cors());
app.use(express.json());

app.post('/log-error', async (req, res) => {
    const { error } = req.body;
    console.error('[FRONTEND ERROR]', error);
    res.sendStatus(200);
});

app.post('/run-llm', async (req, res) => {
    const { prompt } = req.body;
    if (!LOCAL_LLM_URL) {
        return res.status(500).json({ error: 'LOCAL_LLM_URL environment variable is not set.' });
    }
    console.log(`Proxying prompt to local LLM...`);
    try {
        const requestBody = {
            model: "qwen3:30b-a3b",
            messages: [
                { role: "system", content: "You are an expert in your given field." },
                { role: "user", content: prompt }
            ],
            max_tokens: 2048,
            temperature: 0.5,
            stream: true
        };

        const llmResponse = await axios.post(`${LOCAL_LLM_URL}/chat`, requestBody, {
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'application/octet-stream');
        llmResponse.data.pipe(res);

        llmResponse.data.on('error', (err) => {
            console.error('Stream error from Ollama:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'LLM stream error' });
            }
            res.end();
        });

    } catch (error) {
        console.error('Error proxying to local LLM:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Failed to connect to local LLM', 
                details: error.message 
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});