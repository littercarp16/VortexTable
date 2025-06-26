import type { TableOptions } from '../types';
import type { Layer } from './Layer';

export class Renderer {
  private layers: Layer[] = [];
  private renderScheduled: boolean = false;
  private options: Required<TableOptions>;
  private isRendering: boolean = false;
  private renderQueued: boolean = false;

  constructor(options: Required<TableOptions>) {
    this.options = options;
  }

  public setLayers(layers: Layer[]): void {
    this.layers = layers;
  }

  public scheduleRender(): void {
    if (this.renderScheduled) return;
    
    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.render();
      this.renderScheduled = false;
    });
  }

  public render(): void {
    const context = {
        width: this.options.width,
        height: this.options.height,
    };

    this.layers.forEach(layer => {
      if (layer.isDirty()) {
        layer.render(context);
      }
    });

    this.renderQueued = false;
  }
} 