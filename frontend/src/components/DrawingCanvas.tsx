import React, { useRef, useEffect } from 'react';
import { createCanvasMCPServer } from '../mcp/canvas-mcp-server';
import messageBus from '../mcp/MessageBus';
import { CanvasExpertAgent } from '../mcp/CanvasExpertAgent';

const DrawingCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            // This creates the server and automatically registers all its handlers.
            createCanvasMCPServer(canvasRef.current);
        }
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{ border: '1px solid #ccc', borderRadius: '4px', width: '100%', height: 'auto' }}
        />
    );
};

export default DrawingCanvas;