import { useState } from 'react';
import './App.css';
import DrawingCanvas from './components/DrawingCanvas';
import managerPromptTemplate from './prompts/manager_prompt.txt?raw';
import drawingPromptTemplate from './prompts/drawing_prompt.txt?raw';
import browserPromptTemplate from './prompts/browser_prompt.txt?raw'; // We will create this next

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const getManagerPrompt = (goal: string): string => {
    return managerPromptTemplate.replace('{{goal}}', goal);
};

const getExpertPrompt = (taskType: string, goal: string): string => {
    let template = '';
    if (taskType === 'browser_automation') {
        template = browserPromptTemplate;
    } else if (taskType === 'drawing') {
        template = drawingPromptTemplate;
    }
    return template.replace('{{goal}}', goal);
};

function App() {
    const [goal, setGoal] = useState('Draw a clock showing the current time.');
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [drawingCode, setDrawingCode] = useState<string | null>(null);

    const addLog = (message: string) => {
        setLogs(prev => [message, ...prev]);
    };

    const runLLM = async (prompt: string): Promise<any> => {
        addLog(`🤖 [Agent]: Thinking...`);
        const response = await fetch(`${BACKEND_URL}/run-llm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        if (!response.body) throw new Error('Response body is empty.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let llmResult = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if (buffer) {
                    try {
                        const parsed = JSON.parse(buffer);
                        if (parsed.message && parsed.message.content) {
                            llmResult += parsed.message.content;
                        }
                    } catch (e) { /* Incomplete JSON is fine */ }
                }
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            let boundary;
            while ((boundary = buffer.indexOf('\n')) !== -1) {
                const piece = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 1);
                if (piece) {
                    try {
                        const parsed = JSON.parse(piece);
                        if (parsed.message && parsed.message.content) {
                            llmResult += parsed.message.content;
                        }
                    } catch (e) {
                        console.warn(`Could not parse a line from the LLM stream: "${piece}"`);
                    }
                }
            }
        }

        addLog(`🧠 [Agent]: Generated a response.`);
        const jsonMatch = llmResult.match(/```(json)?\n([\s\S]*?)\n```/);
        const extractedContent = jsonMatch ? jsonMatch[2] : llmResult;
        return extractedContent.trim();
    };

    const executeBrowserCode = async (code: string) => {
        addLog(`▶️ [Browser Expert]: Executing Playwright code...`);
        try {
            const response = await fetch(`${BACKEND_URL}/execute-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || 'Unknown error from backend');
            }
            addLog(`✅ [Browser Expert]: ${data.message}`);
            if (data.logs) {
                data.logs.forEach((log: string) => addLog(`📄 [Browser Log]: ${log}`));
            }

        } catch (error: any) {
            const errorMessage = error.message || 'An unknown error occurred.';
            addLog(`❌ [Browser Expert]: Code execution failed - ${errorMessage}`);
            throw new Error(`Code execution failed: ${errorMessage}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLogs([]);
        setDrawingCode(null);

        try {
            // Step 1: Ask the Manager to classify the task
            addLog('🚀 Starting Agent Swarm...');
            const managerPrompt = getManagerPrompt(goal);
            const managerResponse = await runLLM(managerPrompt);
            const plan = JSON.parse(managerResponse);

            addLog(`[DEBUG] Received plan from Manager: ${JSON.stringify(plan, null, 2)}`);

            if (!plan || !plan.taskType) {
                throw new Error('Manager failed to classify the task.');
            }

            // Step 2: Get the code from the relevant expert
            const expertPrompt = getExpertPrompt(plan.taskType, goal);
            const expertCode = await runLLM(expertPrompt);

            // Step 3: Execute the code
            if (plan.taskType === 'browser_automation') {
                await executeBrowserCode(expertCode);
            } else if (plan.taskType === 'drawing') {
                setDrawingCode(expertCode);
                addLog('✅ [Drawing Expert]: Canvas updated with new code.');
            } else {
                throw new Error(`Unknown task type: ${plan.taskType}`);
            }

            addLog('🎉 Swarm task finished successfully!');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`❌ Top-level Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Web Agent Swarm</h1>
                <p>An experiment in multi-capability agent systems.</p>
            </header>
            <main>
                <div className="left-panel">
                    <div className="control-panel">
                        <h2>Control Panel</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="goal">Your Goal:</label>
                                <textarea
                                    id="goal"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="e.g., Draw a clock showing the current time."
                                    rows={4}
                                />
                            </div>
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? 'Running...' : 'Execute Goal'}
                            </button>
                        </form>
                    </div>
                    <div className="logs-container">
                        <h2>Logs</h2>
                        <div className="logs">
                            {logs.map((log, index) => (
                                <div key={index} className="log-entry">{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="right-panel">
                    <div className="canvas-container">
                        <h2>Canvas</h2>
                        <DrawingCanvas code={drawingCode} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
