const express = require('express');
const axios = require('axios');
const { chromium } = require('playwright');
const cors = require('cors');
const vm = require('vm');

const app = express();
const port = 3000;

const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL;
const PLAYWRIGHT_MCP_URL = process.env.PLAYWRIGHT_MCP_URL;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // Allow larger request bodies for code

let browser = null;
let page = null;

// Graceful shutdown
const cleanup = async () => {
    console.log('Closing browser connection...');
    if (browser && browser.isConnected()) {
        await browser.close();
    }
    process.exit(0);
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function getBrowserPage() {
    if (!page || page.isClosed() || !browser || !browser.isConnected()) {
        console.log('No active page found. Re-establishing connection...');
        if (!PLAYWRIGHT_MCP_URL) {
            throw new Error('PLAYWRIGHT_MCP_URL environment variable is not set.');
        }
        try {
            // If browser exists but is disconnected, close it first.
            if (browser && !browser.isConnected()) {
                await browser.close();
                browser = null;
            }

            browser = await chromium.connect(PLAYWRIGHT_MCP_URL, {
                headers: {
                    'x-mcr-service-install': 'true',
                    'x-mcr-proxy-browser-path': 'chromium',
                    'x-mcr-launch-options': JSON.stringify({ headless: false }),
                },
                timeout: 60000,
            });
            console.log('Browser connected.');
            browser.on('disconnected', () => {
                console.log('Browser disconnected. Cleaning up.');
                browser = null;
                page = null;
            });
            page = await browser.newPage();
            console.log('Playwright page connected and ready.');
        } catch (e) {
            console.error('Failed to connect to Playwright:', e);
            throw e;
        }
    }
    return page;
}

app.post('/execute-code', async (req, res) => {
    const { code } = req.body;
    console.log('[EXEC] Received code for execution.');

    if (!code) {
        return res.status(400).json({ error: 'No code provided for execution.' });
    }

    try {
        const page = await getBrowserPage();
        const sandboxedConsole = [];

        // Create a secure sandbox
        const sandbox = {
            page,
            console: {
                log: (...args) => {
                    const message = args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg) : arg
                    ).join(' ');
                    sandboxedConsole.push(message);
                }
            },
        };

        const context = vm.createContext(sandbox);

        // Wrap the user's code in an async function to allow top-level await
        const codeToRun = `(async () => {\n${code}\n})();`;

        await vm.runInContext(codeToRun, context, { timeout: 120000 }); // 2 minute timeout

        console.log('[EXEC] Code executed successfully.');
        res.json({ 
            message: 'Code executed successfully.', 
            logs: sandboxedConsole 
        });

    } catch (error) {
        console.error(`[EXEC] CRITICAL FAILURE during code execution:`, error);
        res.status(500).json({ 
            error: 'Failed to execute code', 
            details: error.message 
        });
    }
});

app.post('/draw', async (req, res) => {
    const { instructions } = req.body;
    console.log('[DRAW] Received drawing instructions.');

    if (!instructions || !Array.isArray(instructions)) {
        return res.status(400).json({ error: 'Invalid drawing instructions provided.' });
    }

    // In a real-world scenario, you might add more validation here.

    res.json({ 
        message: 'Drawing instructions validated successfully.', 
        instructions 
    });
});

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
                { role: "system", content: "You are an expert in Playwright automation." },
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
