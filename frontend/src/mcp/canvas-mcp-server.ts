import { createMCPServer, MCPServer } from './pubsub';

export function createCanvasMCPServer(canvas: HTMLCanvasElement): MCPServer {
  const ctx = canvas.getContext('2d')!;
  const server = createMCPServer();

  // 3.1. State Management
  server.handle('set_fill_style', async (params: { color: string }) => {
    ctx.fillStyle = params.color;
    return { success: true };
  });

  server.handle('set_stroke_style', async (params: { color: string; lineWidth: number }) => {
    ctx.strokeStyle = params.color;
    ctx.lineWidth = params.lineWidth;
    return { success: true };
  });

  server.handle('set_font', async (params: { font: string }) => {
    ctx.font = params.font;
    return { success: true };
  });

  // 3.2. Drawing Actions
  server.handle('clear_rect', async (params: { x: number; y: number; width: number; height: number }) => {
    ctx.clearRect(params.x, params.y, params.width, params.height);
    return { success: true };
  });

  server.handle('fill_rect', async (params: { x: number; y: number; width: number; height: number; color?: string }) => {
    if (params.color) ctx.fillStyle = params.color;
    ctx.fillRect(params.x, params.y, params.width, params.height);
    return { success: true };
  });

  server.handle('stroke_rect', async (params: { x: number; y: number; width: number; height: number; color?: string; lineWidth?: number }) => {
    if (params.color) ctx.strokeStyle = params.color;
    if (params.lineWidth) ctx.lineWidth = params.lineWidth;
    ctx.strokeRect(params.x, params.y, params.width, params.height);
    return { success: true };
  });

  server.handle('fill_text', async (params: { text: string; x: number; y: number; color?: string; font?: string }) => {
    if (params.color) ctx.fillStyle = params.color;
    if (params.font) ctx.font = params.font;
    ctx.fillText(params.text, params.x, params.y);
    return { success: true };
  });

  // 3.3. Path-Based Drawing
  server.handle('draw_path', async (params: any) => {
    ctx.save();
    if (params.fillStyle) ctx.fillStyle = params.fillStyle;
    if (params.strokeStyle) ctx.strokeStyle = params.strokeStyle;
    if (params.lineWidth) ctx.lineWidth = params.lineWidth;

    ctx.beginPath();
    params.path.forEach((segment: any) => {
      switch (segment.type) {
        case 'begin_path': ctx.beginPath(); break; // Though beginPath is called initially, it can be used to reset a path.
        case 'move_to': ctx.moveTo(...segment.args); break;
        case 'line_to': ctx.lineTo(...segment.args); break;
        case 'arc': ctx.arc(...segment.args); break;
        case 'rect': ctx.rect(...segment.args); break;
        case 'close_path': ctx.closePath(); break;
      }
    });

    if (params.fillStyle) ctx.fill();
    if (params.strokeStyle) ctx.stroke();

    ctx.restore();
    return { success: true };
  });

  return server;
}