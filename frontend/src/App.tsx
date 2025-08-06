import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import DrawingCanvas from './components/DrawingCanvas';
import messageBus, { Message } from './mcp/MessageBus';
import { ManagerAgent } from './mcp/ManagerAgent';
import { CanvasExpertAgent } from './mcp/CanvasExpertAgent';
import { LoggerAgent } from './mcp/LoggerAgent';
import { Agent } from './mcp/Agent';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function App() {
    const { t } = useTranslation();
    const [goal, setGoal] = useState(t('goal_placeholder'));
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const isInitialized = useRef(false);

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

        if (!response.ok || !response.body) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            // Ollama streaming sends multiple JSON objects, we need to parse them one by one
            const jsonObjects = chunk.split('\n').filter(str => str.length > 0);
            for (const jsonObjStr of jsonObjects) {
                try {
                    const parsed = JSON.parse(jsonObjStr);
                    if (parsed.message && parsed.message.content) {
                        fullResponse += parsed.message.content;
                    }
                } catch (e) {
                    console.error("Failed to parse JSON chunk:", jsonObjStr);
                }
            }
        }

        addLog(`🧠 [Agent]: Generated a response.`);
        return fullResponse.trim();
    };

    useEffect(() => {
        if (!isInitialized.current) {
            const logger = new LoggerAgent(addLog);
            const manager = new ManagerAgent(runLLM);
            const canvasExpert = new CanvasExpertAgent(runLLM);

            class UIAgent extends Agent {
                role = 'ui';
                async handleMessage(message: Message): Promise<void> {
                    if (message.content.status === 'complete') {
                        setIsLoading(false);
                        addLog('✅ Task Complete!');
                    }
                }
            }

            messageBus.register(logger);
            messageBus.register(manager);
            messageBus.register(canvasExpert);
            messageBus.register(new UIAgent());

            isInitialized.current = true;
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLogs([]);
        addLog('🚀 Starting Agent Swarm...');

        try {
            messageBus.dispatch({ sender: 'user', receiver: 'manager', content: { goal } });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`❌ Top-level Error: ${errorMessage}`);
            setIsLoading(false); // Also stop loading on error
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>{t('app_title')}</h1>
                <p>{t('app_subtitle')}</p>
            </header>
            <main>
                <div className="left-panel">
                    <div className="control-panel">
                        <h2>{t('control_panel_title')}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="goal">{t('goal_label')}</label>
                                <textarea
                                    id="goal"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    disabled={isLoading}
                                    placeholder={t('goal_placeholder')}
                                    rows={4}
                                />
                            </div>
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? t('running_button') : t('execute_button')}
                            </button>
                        </form>
                    </div>
                    <div className="logs-container">
                        <h2>{t('logs_title')}</h2>
                        <div className="logs">
                            {logs.map((log, index) => (
                                <div key={index} className="log-entry">{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="right-panel">
                    <div className="canvas-container">
                        <h2>{t('canvas_title')}</h2>
                        <DrawingCanvas />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
