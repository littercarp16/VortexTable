import type { Column, Theme, Point, Size, Rect, RenderContext } from '../types';

export abstract class Layer {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected name: string;
  protected zIndex: number;
  protected dpr: number;
  protected dirty: boolean = true;
  protected visible: boolean = true;
  protected scrollX: number = 0;
  protected scrollY: number = 0;
  protected columns: Column[] = [];

  constructor(name: string, zIndex: number) {
    this.name = name;
    this.zIndex = zIndex;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas = document.createElement('canvas');
    this.canvas.style.borderBottomLeftRadius = '4px';
    this.canvas.style.borderBottomRightRadius = '4px';
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = this.zIndex.toString();
  }

  public getName(): string {
    return this.name;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  public mount(container: HTMLElement, width: number, height: number): void {
    container.appendChild(this.canvas);
    this.setSize(width, height);
  }

  public setSize(width: number, height: number): void {
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.dpr, this.dpr);
    this.markDirty();
  }

  public markDirty(): void {
    this.dirty = true;
  }

  public isDirty(): boolean {
    return this.dirty;
  }

  public show(): void {
    this.visible = true;
    this.canvas.style.display = '';
  }

  public hide(): void {
    this.visible = false;
    this.canvas.style.display = 'none';
  }

  public clear(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width / this.dpr, height / this.dpr);
  }

  public abstract render(context: any): void;

  protected getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  protected getCanvasSize(): { width: number, height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  public setScrollPosition(x: number, y: number): void {
    this.scrollX = x;
    this.scrollY = y;
    this.markDirty();
  }

  public setScrollX(x: number): void {
    this.scrollX = x;
    this.markDirty();
  }
  
  public setColumns(columns: Column[]): void {
    this.columns = columns;
    this.markDirty();
  }
} 