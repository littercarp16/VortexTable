import type { VirtualScrollInfo, DataLoader, RowData } from '../types';

export class VirtualScrollManager {
  private totalRows: number = 0;
  private rowHeight: number = 30;
  private containerHeight: number = 0;
  private scrollTop: number = 0;
  private dataLoader?: DataLoader;
  private bufferSize: number = 5; // 上下各缓冲5行
  private cachedData: Map<number, RowData> = new Map();
  private loadingPromises: Map<string, Promise<RowData[]>> = new Map();

  constructor(options: {
    totalRows: number;
    rowHeight: number;
    containerHeight: number;
    bufferSize?: number;
    dataLoader?: DataLoader;
  }) {
    this.totalRows = options.totalRows;
    this.rowHeight = options.rowHeight;
    this.containerHeight = options.containerHeight;
    this.bufferSize = options.bufferSize || 5;
    if (options.dataLoader) {
      this.dataLoader = options.dataLoader;
    }
  }

  public setScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  public setContainerHeight(height: number): void {
    this.containerHeight = height;
  }

  public setTotalRows(totalRows: number): void {
    this.totalRows = totalRows;
  }

  public setDataLoader(dataLoader: DataLoader): void {
    this.dataLoader = dataLoader;
  }

  public getVirtualScrollInfo(): VirtualScrollInfo {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.rowHeight) - this.bufferSize);
    const visibleCount = Math.ceil(this.containerHeight / this.rowHeight);
    const endIndex = Math.min(this.totalRows - 1, startIndex + visibleCount + this.bufferSize * 2);
    const totalHeight = this.totalRows * this.rowHeight;

    return {
      startIndex,
      endIndex,
      visibleCount,
      totalHeight,
      scrollTop: this.scrollTop
    };
  }

  public async getVisibleData(): Promise<RowData[]> {
    const info = this.getVirtualScrollInfo();
    const data: RowData[] = [];

    // 从缓存或加载器获取数据
    for (let i = info.startIndex; i <= info.endIndex; i++) {
      const cached = this.cachedData.get(i);
      if (cached) {
        data.push(cached);
      } else if (this.dataLoader) {
        // 异步加载数据
        await this.loadDataForIndex(i);
        const loaded = this.cachedData.get(i);
        if (loaded) {
          data.push(loaded);
        }
      }
    }

    return data;
  }

  private async loadDataForIndex(index: number): Promise<void> {
    if (this.cachedData.has(index) || !this.dataLoader) {
      return;
    }

    // 计算需要加载的范围（批量加载）
    const batchSize = 50; // 每次加载50行
    const batchStart = Math.floor(index / batchSize) * batchSize;
    const batchEnd = Math.min(batchStart + batchSize - 1, this.totalRows - 1);
    const batchKey = `${batchStart}-${batchEnd}`;

    // 避免重复加载
    if (this.loadingPromises.has(batchKey)) {
      await this.loadingPromises.get(batchKey);
      return;
    }

    const loadPromise = this.dataLoader(batchStart, batchEnd).then(data => {
      // 缓存加载的数据
      data.forEach((row, i) => {
        this.cachedData.set(batchStart + i, row);
      });
      this.loadingPromises.delete(batchKey);
      return data;
    });

    this.loadingPromises.set(batchKey, loadPromise);
    await loadPromise;
  }

  public clearCache(): void {
    this.cachedData.clear();
    this.loadingPromises.clear();
  }

  public getCachedDataCount(): number {
    return this.cachedData.size;
  }

  public getScrollTopForIndex(index: number): number {
    return index * this.rowHeight;
  }

  public getIndexForScrollTop(scrollTop: number): number {
    return Math.floor(scrollTop / this.rowHeight);
  }
} 