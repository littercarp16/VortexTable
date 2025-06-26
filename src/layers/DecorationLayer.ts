import type { RenderContext, Theme, TableOptions, RowData, Column, Selection } from '../types';
import { Layer } from '../core/Layer';

export class DecorationLayer extends Layer {
  protected options: Required<TableOptions>;
  protected override scrollX: number = 0;
  protected override scrollY: number = 0;
  protected override columns: Column[] = [];
  private selection: Selection | null = null;
  private hoverCell: { row: number; col: number } | null = null;

  constructor(options: Required<TableOptions>) {
    super('decoration', 2);
    this.options = options;
  }

  public setSelection(selection: Selection | null): void {
    this.selection = selection;
    this.markDirty();
  }

  public setHoverCell(cell: { row: number; col: number } | null): void {
    this.hoverCell = cell;
    this.markDirty();
  }

  public override setScrollPosition(x: number, y: number): void {
    this.scrollX = x;
    this.scrollY = y;
    this.markDirty();
  }

  public override render() {
    if (!this.dirty) return;
    this.clear();
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-this.scrollX, -this.scrollY);

    if (this.selection) {
      this.renderSelection(ctx);
    }

    ctx.restore();
    this.dirty = false;
  }

  private renderSelection(ctx: CanvasRenderingContext2D) {
    if (!this.selection) return;

    const { startRow, startCol, endRow, endCol } = this.selection;
    const { rowHeight } = this.options;
    const x = this.columns.slice(0, startCol).reduce((acc, col) => acc + col.width, 0);
    const y = startRow * rowHeight;
    const width = this.columns.slice(startCol, endCol + 1).reduce((acc, col) => acc + col.width, 0);
    const height = (endRow - startRow + 1) * rowHeight;

    ctx.fillStyle = this.options.theme.selectionColor || 'rgba(0, 123, 255, 0.3)';
    ctx.fillRect(x, y, width, height);
  }
} 