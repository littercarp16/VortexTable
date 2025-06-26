import type { TableOptions, RowData, Column } from '../types';
import { Layer } from '../core/Layer';

export class DataLayer extends Layer {
  private dataSource: Map<number, RowData[]> = new Map();
  private getRowData: ((rowIndex: number) => RowData | undefined) | undefined;
  protected options: Required<TableOptions>;
  protected override columns: Column[] = [];
  protected override scrollX: number = 0;
  protected override scrollY: number = 0;
  private onDataChange?: (() => void) | undefined; // 数据变化回调

  constructor(options: Required<TableOptions>) {
    super('data', 1);
    this.options = options;
    this.markDirty();
  }

  public setDataSource(
    dataSource: Map<number, RowData[]>,
    getRowData?: (rowIndex: number) => RowData | undefined,
    onDataChange?: () => void
  ) {
    this.dataSource = dataSource;
    this.getRowData = getRowData;
    this.onDataChange = onDataChange;
    this.markDirty();
    // 通知需要重绘
    if (this.onDataChange) {
      this.onDataChange();
    }
  }
  
  public render(): void {
    if (!this.dirty) return;
    
    const ctx = this.ctx;
    this.clear();

    ctx.save();
    ctx.translate(-this.scrollX, -this.scrollY);

    ctx.font = this.options.theme.font || '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    this.renderDataRows(ctx);
    if (this.options.showGrid) {
      this.renderGrid(ctx);
    }
    
    ctx.restore();
    this.dirty = false;
  }

  private renderDataRows(ctx: CanvasRenderingContext2D): void {
    const { rowHeight, virtualScroll } = this.options;
    const { height: viewportHeight } = this.getCanvasSize();
    ctx.fillStyle = this.options.theme.textColor || '#333';

    // Calculate the range of rows to render
    const startIndex = Math.max(0, Math.floor(this.scrollY / rowHeight));
    const endIndex = Math.min(
        this.options.totalRows - 1,
        startIndex + Math.ceil(viewportHeight / rowHeight)
    );

    for (let i = startIndex; i <= endIndex; i++) {
      let rowData: RowData | undefined;
      if (this.getRowData && this.getRowData(i)) {
        rowData = this.getRowData(i);
      } else {
        // 兼容旧接口
        const pageIndex = Math.floor(i / 1000);
        const page = this.dataSource.get(pageIndex);
        rowData = page ? page[i % 1000] : undefined;
      }
      if (rowData) {
        // 正常渲染数据行
        const y = i * rowHeight;
        let currentX = 0;
        this.columns.forEach((column) => {
          const text = String(rowData.data[column.key] || '');
          ctx.fillText(text, currentX + 10, y + rowHeight / 2);
          currentX += column.width || 100;
        });
      } else {
        // 渲染占位符
        // console.log('renderPlaceholder');
        this.renderPlaceholder(ctx, i);
      }
    }
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    const rowHeight = this.options.rowHeight;
    const { height: viewportHeight } = this.getCanvasSize();
    const totalContentWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    const totalContentHeight = this.options.totalRows * rowHeight;

    ctx.strokeStyle = this.options.theme.gridColor || '#e0e0e0';
    ctx.lineWidth = 1;

    ctx.beginPath();
    let x = 0;
    this.columns.forEach((column, colIndex) => {
      x += column.width || 100;
      ctx.moveTo(x - 0.5, 0);
      ctx.lineTo(x - 0.5, totalContentHeight);
    });
    ctx.stroke();

    const startIndex = Math.max(0, Math.floor(this.scrollY / rowHeight));
    const endIndex = Math.min(this.options.totalRows - 1, startIndex + Math.ceil(viewportHeight / rowHeight) + 1);
    
    ctx.beginPath();
    for(let i = startIndex; i <= endIndex + 1; i++) {
        const y = i * rowHeight + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(totalContentWidth, y);
    }
    ctx.stroke();
  }

  private renderPlaceholder(ctx: CanvasRenderingContext2D, row: number) {
    // 渲染灰色占位行
    ctx.save();
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, row * 35, ctx.canvas.width, 35);
    ctx.restore();
  }

  public override setColumns(columns: Column[]): void {
    this.columns = columns;
    this.markDirty();
  }

  public setScroll(scrollX: number, scrollY: number): void {
    this.scrollX = scrollX;
    this.scrollY = scrollY;
    this.markDirty();
  }

} 