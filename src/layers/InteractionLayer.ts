import type { RenderContext, Point, TableOptions, Column } from '../types';
import { Layer } from '../core/Layer';

export class InteractionLayer extends Layer {
  protected options: Required<TableOptions>;
  protected override scrollX: number = 0;
  protected override scrollY: number = 0;
  protected override columns: Column[] = [];
  private isDragging: boolean = false;
  private dragStart: Point | null = null;
  private dragEnd: Point | null = null;

  constructor(options: Required<TableOptions>) {
    super('interaction', 4); // z-index for interaction
    this.options = options;
  }

  public override setScrollPosition(x: number, y: number): void {
    this.scrollX = x;
    this.scrollY = y;
    this.markDirty();
  }

  public override setColumns(columns: Column[]): void {
    this.columns = columns;
  }

  public handleMouseMove(event: MouseEvent, scrollX: number, scrollY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Logic for hover can be added here
  }

  public handleClick(event: MouseEvent, scrollX: number, scrollY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const row = Math.floor((y + scrollY) / this.options.rowHeight);
    
    let accumulatedWidth = 0;
    let col = -1;
    if (!this.columns) return;
    for (let i = 0; i < this.columns.length; i++) {
        accumulatedWidth += this.columns[i]?.width ?? 100;
        if (x + scrollX < accumulatedWidth) {
            col = i;
            break;
        }
    }
    
    if (row >= 0 && col >= 0) {
        const cellClickEvent = new CustomEvent('cell-click', {
            detail: { row, col }
        });
        this.canvas.dispatchEvent(cellClickEvent);
    }
  }

  private getCellFromPoint(point: Point): { row: number; col: number; cell: any } | null {
    const headerHeight = this.options.showHeader ? (this.options.headerHeight || 40) : 0;
    const rowHeight = this.options.rowHeight || 30;

    // Adjust for scroll
    const virtualX = point.x + this.scrollX;
    const virtualY = point.y + this.scrollY;

    // Check if in header area
    if (this.options.showHeader && point.y < headerHeight) {
      let currentX = 0;
      for (let i = 0; i < this.columns.length; i++) {
        const col = this.columns[i];
        if (col && virtualX >= currentX && virtualX < currentX + col.width) {
          return { row: -1, col: i, cell: null }; // -1 indicates header row
        }
        currentX += col?.width || 0;
      }
    }

    // Calculate data row and column
    const row = Math.floor((virtualY - headerHeight) / rowHeight);
    
    let currentX = 0;
    for (let i = 0; i < this.columns.length; i++) {
        const col = this.columns[i];
        if (col && virtualX >= currentX && virtualX < currentX + col.width) {
            // TODO: get actual cell data
            return { row, col: i, cell: null };
        }
        currentX += col?.width || 0;
    }

    return null;
  }

  public render(): void {
    // Interaction layer is usually transparent
  }
} 