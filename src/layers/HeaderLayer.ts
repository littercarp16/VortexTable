import type { RenderContext, TableOptions, Column } from '../types';
import { Layer } from '../core/Layer';

export class HeaderLayer extends Layer {
  protected options: Required<TableOptions>;
  protected override scrollX: number = 0;
  protected override columns: Column[] = [];

  constructor(options: Required<TableOptions>) {
    super('header', 2); // z-index: 2
    this.options = options;
    this.canvas.style.pointerEvents = 'auto';
    // this.canvas.style.borderBottomLeftRadius = '0px';
    // this.canvas.style.borderBottomRightRadius = '0px';
    this.canvas.style.borderTopLeftRadius = '3px';
    this.canvas.style.borderTopRightRadius = '3px';
    this.markDirty();
  }

  public override setColumns(columns: Column[]): void {
    this.columns = columns;
    this.markDirty();
  }
  
  public override setScrollX(x: number): void {
    this.scrollX = x;
    this.markDirty();
  }

  public render(): void {
    if (!this.dirty) return;
    if (!this.options.showHeader) {
        this.clear();
        this.dirty = false;
        return;
    }

    const ctx = this.ctx;
    const { width } = this.getCanvasSize();
    const headerHeight = this.options.headerHeight;
    const theme = this.options.theme;

    this.clear();

    ctx.save();
    
    ctx.rect(0, 0, width, headerHeight);
    ctx.clip();

    ctx.fillStyle = theme.headerBackgroundColor || '#f5f5f5';
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.font = theme.headerFont || 'bold 14px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.headerTextColor || '#333';

    ctx.translate(-this.scrollX, 0);
    
    let x = 0;
    this.columns.forEach((column: Column) => {
      const text = column.title;
      // TODO: 添加文本对齐逻辑
      ctx.fillText(text, x + 10, headerHeight / 2);
      x += column.width || 100;
    });

    ctx.strokeStyle = theme.gridColor || '#e0e0e0';
    ctx.lineWidth = 1;
    let lineX = 0;
    this.columns.forEach((column) => {
      lineX += column.width || 100;
      ctx.beginPath();
      ctx.moveTo(lineX - 0.5, 0);
      ctx.lineTo(lineX - 0.5, headerHeight);
      ctx.stroke();
    });
    
    ctx.restore();
    
    this.dirty = false;
  }
} 