import React, { useRef, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface DrawingCanvasProps {
    codes: (string | null)[];
}

const logErrorToServer = async (error: any, snippetIndex: number) => {
    try {
        const errorMessage = `Error in drawing code snippet ${snippetIndex + 1}: ${error.toString()}`;
        await fetch(`${BACKEND_URL}/log-error`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: errorMessage }),
        });
    } catch (e) {
        console.error("Failed to log error to server:", e);
    }
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ codes }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Clear the canvas only once at the beginning
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

        if (!codes || codes.length === 0) {
            return;
        }

        // Execute each code snippet in its own sandboxed, immediately-invoked function expression (IIFE)
        codes.forEach((code, index) => {
            if (!code) return;
            
            const iifeCode = `(function(ctx) {\n"use strict";\n${code}\n})(context);`;

            try {
                // We pass the real context to the eval scope.
                eval(iifeCode);
            } catch (error) {
                console.error(`Error executing drawing code snippet ${index + 1}:`, error);
                logErrorToServer(error, index);
                // Display a user-friendly error on the canvas
                context.fillStyle = 'red';
                context.font = '16px sans-serif';
                context.fillText(`Error in step ${index + 1}. See console for details.`, 10, 20 + (index * 20));
            }
        });

    }, [codes]);

    return (
        <canvas 
            ref={canvasRef} 
            width={600} 
            height={600} // Made it a square for better clock drawing
            style={{ border: '1px solid #ccc', borderRadius: '4px', width: '100%', height: 'auto' }}
        />
    );
};

export default DrawingCanvas;
