import type { RenderContext, TableOptions } from '../types';
import { Layer } from '../core/Layer';

export class BackgroundLayer extends Layer {
  private options: Required<TableOptions>;

  constructor(options: Required<TableOptions>) {
    super('background', 0); // z-index: 0
    this.options = options;
  }

  public override render(): void {
    if (!this.dirty) return;
    this.clear();
    
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(0, -this.scrollY);

    // Fill background color for the entire scrollable area
    const { width } = this.getCanvasSize();
    const totalHeight = this.options.totalRows * this.options.rowHeight;
    ctx.fillStyle = this.options.theme.backgroundColor || '#fff';
    ctx.fillRect(0, 0, width, totalHeight);

    
    ctx.restore();
    this.dirty = false;
  }
  
} 