import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import DrawingCanvas from './components/DrawingCanvas';
import Scene from './components/Scene';
import messageBus, { Message } from './mcp/MessageBus';
import { ManagerAgent } from './mcp/ManagerAgent';
import { CanvasExpertAgent } from './mcp/CanvasExpertAgent';
import { SceneExpertAgent } from './mcp/SceneExpertAgent';
import { LoggerAgent } from './mcp/LoggerAgent';
import { Agent } from './mcp/Agent';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function App() {
    const { t } = useTranslation();
    const [goal, setGoal] = useState(t('goal_placeholder'));
    const predefinedGoals = [
        { label: '画一个红色的正方形', value: '画一个红色的正方形' },
        { label: '画一个蓝色的圆形', value: '画一个蓝色的圆形' },
        { label: '画一个从蓝色到红色的线性渐变背景', value: '画一个从蓝色到红色的线性渐变背景' },
        { label: '画一个黄色的五角星', value: '画一个黄色的五角星' },
        { label: '画一棵简单的树', value: '画一棵简单的树' },
        { label: '画一个日落效果', value: '画一个日落效果' },
        { label: '画一个数字时钟', value: '画一个数字时钟' },
        { label: '创建一个包含红色立方体的 3D 场景', value: '创建一个包含红色立方体的 3D 场景' },
        { label: '在 3D 场景中放置一个蓝色的球体和一个绿色的平面', value: '在 3D 场景中放置一个蓝色的球体和一个绿色的平面' },
        { label: '添加一个点光源和一个环境光到 3D 场景', value: '添加一个点光源和一个环境光到 3D 场景' },
        { label: '创建一个带有纹理的立方体', value: '创建一个带有纹理的立方体' },
        { label: '创建一个旋转的甜甜圈', value: '创建一个旋转的甜甜圈' },
        { label: '清空 2D 画布', value: '清空 2D 画布' },
        { label: '清空 3D 场景', value: '清空 3D 场景' },
    ];
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
            const sceneExpert = new SceneExpertAgent(runLLM);

            class UIAgent extends Agent {
                role = 'ui';
                async handleMessage(message: Message): Promise<void> {
                    if (message.content.status === 'complete') {
                        setIsLoading(false);
                        addLog('✅ Task Complete!');
                    } else if (message.content.status === 'error') {
                        setIsLoading(false);
                        addLog(`❌ Error: ${message.content.error}`);
                    }
                }
            }

            messageBus.register(logger);
            messageBus.register(manager);
            messageBus.register(canvasExpert);
            messageBus.register(sceneExpert);
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
            <main className="main-content">
                <div className="left-panel">
                    <div className="control-panel">
                        <h2>{t('control_panel_title')}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="goal-select">{t('select_goal_label')}</label>
                                <select
                                    id="goal-select"
                                    onChange={(e) => setGoal(e.target.value)}
                                    value={goal}
                                    disabled={isLoading}
                                >
                                    {predefinedGoals.map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label htmlFor="goal-textarea">{t('goal_label')}</label>
                                <textarea
                                    id="goal-textarea"
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
                <div className="center-panel">
                    <div className="canvas-container">
                        <h2>{t('canvas_title')}</h2>
                        <DrawingCanvas />
                    </div>
                </div>
                <div className="right-panel">
                    <div className="scene-container">
                        <h2>3D Scene</h2>
                        <Scene />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
