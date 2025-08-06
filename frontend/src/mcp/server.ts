type MCPCommand = {
  action: string;
  params: any;
};

class CanvasMCPServer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  public executeCommands(commands: MCPCommand[]) {
    commands.forEach(command => this.executeCommand(command));
  }

  private executeCommand(command: MCPCommand) {
    const { action, params } = command;

    switch (action) {
      case 'set_fill_style':
        this.ctx.fillStyle = params.color;
        break;
      case 'set_stroke_style':
        this.ctx.strokeStyle = params.color;
        this.ctx.lineWidth = params.lineWidth;
        break;
      case 'set_font':
        this.ctx.font = params.font;
        break;
      case 'clear_rect':
        this.ctx.clearRect(params.x, params.y, params.width, params.height);
        break;
      case 'fill_rect':
        this.ctx.fillRect(params.x, params.y, params.width, params.height);
        break;
      case 'stroke_rect':
        this.ctx.strokeRect(params.x, params.y, params.width, params.height);
        break;
      case 'fill_text':
        this.ctx.fillText(params.text, params.x, params.y, params.maxWidth);
        break;
      case 'draw_path':
        this.drawPath(params);
        break;
      default:
        console.warn(`Unknown canvas action: ${action}`);
    }
  }

  private drawPath(params: any) {
    this.ctx.save();
    if (params.fillStyle) this.ctx.fillStyle = params.fillStyle;
    if (params.strokeStyle) this.ctx.strokeStyle = params.strokeStyle;
    if (params.lineWidth) this.ctx.lineWidth = params.lineWidth;

    params.path.forEach((segment: any) => {
      switch (segment.type) {
        case 'begin_path':
          this.ctx.beginPath();
          break;
        case 'move_to':
          this.ctx.moveTo(...segment.args);
          break;
        case 'line_to':
          this.ctx.lineTo(...segment.args);
          break;
        case 'arc':
          this.ctx.arc(...segment.args);
          break;
        case 'rect':
          this.ctx.rect(...segment.args);
          break;
        case 'close_path':
          this.ctx.closePath();
          break;
      }
    });

    if (params.fillStyle) this.ctx.fill();
    if (params.strokeStyle) this.ctx.stroke();

    this.ctx.restore();
  }
}

export default CanvasMCPServer;
