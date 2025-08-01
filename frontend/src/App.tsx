import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import DrawingCanvas from './components/DrawingCanvas';
import managerPromptTemplate from './prompts/manager_prompt.txt?raw';
import drawingGridPromptTemplate from './prompts/draw_grid_prompt.txt?raw';
import drawingPiecesPromptTemplate from './prompts/draw_pieces_prompt.txt?raw';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const getManagerPrompt = (context: any): string => {
    return managerPromptTemplate.replace('{{context}}', JSON.stringify(context, null, 2));
};

const getExpertPrompt = (action: any, goal: string): string => {
    let template = '';
    if (action.action === 'draw_grid') {
        template = drawingGridPromptTemplate;
    } else if (action.action === 'draw_pieces') {
        template = drawingPiecesPromptTemplate.replace('{{context.team === \'white\' ? \'\'white\'\' : \'\'black\'\'}}', action.payload.team === 'white' ? "white" : "black");
    }
    return template.replace('{{goal}}', goal);
};

function App() {
    const { t } = useTranslation();
    const [goal, setGoal] = useState(t('goal_placeholder'));
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [drawingCodes, setDrawingCodes] = useState<(string | null)[]>([]);

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
        const codeMatch = llmResult.match(/```(?:javascript|json)?\n([\s\S]*?)\n```/);
        const extractedContent = codeMatch ? codeMatch[1] : llmResult;
        return extractedContent.trim();
    };

    const runManagerAgent = async (context: any): Promise<any> => {
        const managerPrompt = getManagerPrompt(context);
        const managerResponse = await runLLM(managerPrompt);
        return JSON.parse(managerResponse);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLogs([]);
        setDrawingCodes([]);
        addLog('🚀 Starting Agent Swarm...');

        const context = {
            goal: goal,
            history: [],
        };

        try {
            let loopCount = 0;
            const maxLoops = 10; // Safety break

            while (loopCount < maxLoops) {
                loopCount++;
                addLog(`--- Turn ${loopCount} ---`);

                const nextAction = await runManagerAgent(context);

                addLog(`[DEBUG] Next action from Manager: ${JSON.stringify(nextAction, null, 2)}`);

                if (nextAction.action === 'finish') {
                    addLog(`🏁 [Manager]: Task finished. Reason: ${nextAction.payload.reason}`);
                    break; // Exit the loop
                }

                const expertPrompt = getExpertPrompt(nextAction, context.goal);
                const expertCode = await runLLM(expertPrompt);

                if (nextAction.action.startsWith('draw_')) {
                    setDrawingCodes(prevCodes => [...prevCodes, expertCode]);
                    addLog('✅ [Drawing Expert]: Canvas updated with new code.');
                } else {
                    throw new Error(`Unknown action type: ${nextAction.action}`);
                }

                context.history.push(nextAction);
            }

            if (loopCount >= maxLoops) {
                addLog('⚠️ Safety break triggered. Maximum loop count reached.');
            }

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
                        <DrawingCanvas codes={drawingCodes} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
