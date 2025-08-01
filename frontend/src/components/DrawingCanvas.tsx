import React, { useRef, useEffect } from 'react';

interface DrawingCanvasProps {
    code: string | null;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ code }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Clear the canvas before drawing
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

        if (!code) {
            return; // Do nothing if there's no code
        }

        try {
            // Create a sandboxed function. It can only access the 'ctx' object.
            const drawFunction = new Function('ctx', code);
            drawFunction(context);
        } catch (error) {
            console.error("Error executing drawing code:", error);
            // Optionally, display an error message on the canvas
            context.fillStyle = 'red';
            context.font = '16px sans-serif';
            context.fillText('Error in drawing code. See console for details.', 10, 20);
        }

    }, [code]);

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