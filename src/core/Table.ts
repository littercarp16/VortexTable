import { Renderer } from './Renderer';
import { Layer } from './Layer';
import { DataLayer } from '../layers/DataLayer';
import { BackgroundLayer } from '../layers/BackgroundLayer';
import { DecorationLayer } from '../layers/DecorationLayer';
import { HeaderLayer } from '../layers/HeaderLayer';
import { InteractionLayer } from '../layers/InteractionLayer';
import { EventManager } from './EventManager';
import type { TableOptions, Column, Point, Theme, RowData, Selection, TableEventMap, DataLoader, CellData } from '../types';

const defaultTheme: Theme = {
  font: '14px Arial',
  textColor: '#333',
  headerFont: 'bold 14px Arial',
  headerTextColor: '#000',
  headerBackgroundColor: '#f2f2f2',
  gridColor: '#e0e0e0',
  selectionColor: 'rgba(0, 123, 255, 0.3)',
  hoverColor: 'rgba(0, 123, 255, 0.1)',
};

const defaultOptions: Omit<Required<TableOptions>, 'width' | 'height' | 'data' | 'columns'> = {
  rowHeight: 35,
  headerHeight: 40,
  totalRows: 0,
  showHeader: true,
  showGrid: true,
  theme: defaultTheme,
  virtualScroll: {
    enabled: true,
    bufferSize: 10,
  },
  pagination: {
    enabled: false,
    pageSize: 100,
    pageNum: 1,
    total: 0,
  },
};

export class VortexTable {
  private container: HTMLElement;
  private headerWrapper!: HTMLElement;
  private canvasContainer!: HTMLElement; // Holds all data-related canvases, does not scroll
  private scrollContainer!: HTMLElement; // Overlay for scrolling only
  private sizer!: HTMLElement;
  private layers: Map<string, Layer> = new Map();
  private renderer: Renderer;
  private options: Required<TableOptions>;
  private columns: Column[];
  private totalRows: number = 0;
  private scrollX: number = 0;
  private scrollY: number = 0;
  private eventManager: EventManager;
  private dataLoader?: DataLoader;
  private loadedPages: Map<number, RowData[]> = new Map(); // key: pageIndex, value: RowData[]
  private highestLoadedRow: number = 0;
  private isFetching: boolean = false;
  private verticalScrollbar!: HTMLElement;
  private horizontalScrollbar!: HTMLElement;
  private verticalThumb!: HTMLElement;
  private horizontalThumb!: HTMLElement;
  private verticalHideTimer: any = null;
  
  constructor(container: HTMLElement, options: Partial<TableOptions> = {}) {
    this.container = container;
    
    const theme = { ...defaultTheme, ...options.theme };
    
    const resolvedOptions: Required<TableOptions> = {
      ...defaultOptions,
      ...options,
      theme,
      width: options.width || 0,
      height: options.height || 0,
      totalRows: options.totalRows || 0,
      data: [], // Data is managed by loadedPages map
      columns: options.columns || [],
    };
    this.options = resolvedOptions;

    this.eventManager = new EventManager();
    this.columns = this.options.columns;
    this.totalRows = this.options.totalRows;
    this.renderer = new Renderer(this.options);

    this.initDOM();
    this.initLayers();
    this.setDimensions();
    this.attachEventListeners();
    this.loadInitialData();
  }

  private initDOM(): void {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    this.headerWrapper = document.createElement('div');
    this.headerWrapper.style.position = 'relative';
    this.container.appendChild(this.headerWrapper);

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.style.position = 'relative';
    this.container.appendChild(this.canvasContainer);

    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.position = 'absolute';
    this.scrollContainer.style.overflow = 'hidden'; // 禁用原生滚动条
    this.scrollContainer.style.pointerEvents = 'none';
    this.container.appendChild(this.scrollContainer);

    this.sizer = document.createElement('div');
    this.sizer.style.pointerEvents = 'auto';
    this.scrollContainer.appendChild(this.sizer);

    // 新增：自定义纵向滚动条
    this.verticalScrollbar = document.createElement('div');
    this.verticalScrollbar.className = 'vtx-scrollbar-vertical';
    this.verticalScrollbar.style.position = 'absolute';
    this.verticalScrollbar.style.top = '0';
    this.verticalScrollbar.style.right = '0';
    this.verticalScrollbar.style.width = '8px';
    this.verticalScrollbar.style.height = '100%';
    this.verticalScrollbar.style.background = 'rgba(0,0,0,0.08)';
    this.verticalScrollbar.style.borderRadius = '4px';
    this.verticalScrollbar.style.opacity = '0'; // 初始隐藏
    this.verticalScrollbar.style.transition = 'opacity 0.3s';
    this.verticalScrollbar.style.zIndex = '1000'; // 提高层级
    this.verticalScrollbar.style.pointerEvents = 'auto'; // 确保可以接收事件
    this.container.appendChild(this.verticalScrollbar);

    // 新增：自定义横向滚动条
    this.horizontalScrollbar = document.createElement('div');
    this.horizontalScrollbar.className = 'vtx-scrollbar-horizontal';
    this.horizontalScrollbar.style.position = 'absolute';
    this.horizontalScrollbar.style.left = '0';
    this.horizontalScrollbar.style.bottom = '0';
    this.horizontalScrollbar.style.height = '8px';
    this.horizontalScrollbar.style.width = '100%';
    this.horizontalScrollbar.style.background = 'rgba(0,0,0,0.08)';
    this.horizontalScrollbar.style.borderRadius = '4px';
    this.horizontalScrollbar.style.opacity = '0'; // 初始隐藏
    this.horizontalScrollbar.style.transition = 'opacity 0.3s';
    this.horizontalScrollbar.style.zIndex = '1000'; // 提高层级
    this.horizontalScrollbar.style.pointerEvents = 'auto'; // 确保可以接收事件
    this.container.appendChild(this.horizontalScrollbar);

    // 纵向滚动条滑块
    this.verticalThumb = document.createElement('div');
    this.verticalThumb.className = 'vtx-scrollbar-thumb-vertical';
    this.verticalThumb.style.position = 'absolute';
    this.verticalThumb.style.left = '0';
    this.verticalThumb.style.width = '100%';
    this.verticalThumb.style.background = 'rgba(0,0,0,0.3)';
    this.verticalThumb.style.borderRadius = '4px';
    this.verticalThumb.style.cursor = 'pointer';
    this.verticalThumb.style.transition = 'background 0.2s';
    this.verticalThumb.style.pointerEvents = 'auto'; // 确保可以接收事件
    this.verticalScrollbar.appendChild(this.verticalThumb);

    // 横向滚动条滑块
    this.horizontalThumb = document.createElement('div');
    this.horizontalThumb.className = 'vtx-scrollbar-thumb-horizontal';
    this.horizontalThumb.style.position = 'absolute';
    this.horizontalThumb.style.top = '0';
    this.horizontalThumb.style.height = '100%';
    this.horizontalThumb.style.background = 'rgba(0,0,0,0.3)';
    this.horizontalThumb.style.borderRadius = '4px';
    this.horizontalThumb.style.cursor = 'pointer';
    this.horizontalThumb.style.transition = 'background 0.2s';
    this.horizontalThumb.style.pointerEvents = 'auto'; // 确保可以接收事件
    this.horizontalScrollbar.appendChild(this.horizontalThumb);

    // 事件监听
    this.verticalThumb.addEventListener('mousedown', this.onVerticalThumbMouseDown);
    this.horizontalThumb.addEventListener('mousedown', this.onHorizontalThumbMouseDown);
    this.verticalScrollbar.addEventListener('mouseenter', this.showVerticalScrollbar);
    this.verticalScrollbar.addEventListener('mouseleave', this.hideVerticalScrollbarDelayed);
    this.container.addEventListener('wheel', this.onMouseWheel, { passive: false });
    // 轨道点击
    this.verticalScrollbar.addEventListener('mousedown', this.onVerticalTrackMouseDown);
    this.horizontalScrollbar.addEventListener('mousedown', this.onHorizontalTrackMouseDown);
    // 滑块 hover/active 效果
    this.verticalThumb.addEventListener('mouseenter', () => {
      console.log('Vertical thumb mouseenter'); // 调试信息
      this.verticalThumb.style.background = 'rgba(0,0,0,0.5)';
    });
    this.verticalThumb.addEventListener('mouseleave', () => {
      console.log('Vertical thumb mouseleave'); // 调试信息
      this.verticalThumb.style.background = 'rgba(0,0,0,0.3)';
    });
    this.horizontalThumb.addEventListener('mouseenter', () => {
      this.horizontalThumb.style.background = 'rgba(0,0,0,0.5)';
    });
    this.horizontalThumb.addEventListener('mouseleave', () => {
      this.horizontalThumb.style.background = 'rgba(0,0,0,0.3)';
    });
  }

  private initLayers(): void {
    this.layers.set('background', new BackgroundLayer(this.options));
    this.layers.set('data', new DataLayer(this.options));
    this.layers.set('header', new HeaderLayer(this.options));
    this.layers.set('decoration', new DecorationLayer(this.options));
    this.layers.set('interaction', new InteractionLayer(this.options));

    this.layers.forEach((layer, name) => {
      const canvas = layer.getCanvas();
      if (name === 'header') {
        this.headerWrapper.appendChild(canvas);
      } else {
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        this.canvasContainer.appendChild(canvas);
      }
    });

    this.renderer.setLayers(Array.from(this.layers.values()));
    this.setColumns(this.columns);
  }

  private attachEventListeners(): void {
    // 移除对scrollContainer的滚动事件监听，因为scrollContainer设置了overflow: hidden
    // this.scrollContainer.addEventListener('scroll', this.handleScroll);
    
    // Forward mouse events from the top-level container to the interaction layer
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  private handleMouseMove(e: MouseEvent): void {
    const interactionLayer = this.layers.get('interaction') as InteractionLayer;
    interactionLayer?.handleMouseMove(e, this.scrollX, this.scrollY);
  }
  
  private handleClick(e: MouseEvent): void {
    const interactionLayer = this.layers.get('interaction') as InteractionLayer;
    interactionLayer?.handleClick(e, this.scrollX, this.scrollY);
  }

  public scheduleRender(): void {
    // console.log('scheduleRender');
    this.renderer.scheduleRender();
  }

  // 新增：更新滚动位置并触发渲染的方法
  private updateScrollPosition(newScrollX: number, newScrollY: number): void {
    this.scrollX = newScrollX;
    const maxScroll = this.getMaxScrollY();
    this.scrollY = Math.max(0, Math.min(newScrollY, maxScroll));

    // Update horizontal scroll for the fixed header
    const headerLayer = this.layers.get('header') as HeaderLayer;
    headerLayer?.setScrollX(this.scrollX);

    // Update scroll position for all data-related layers for virtual rendering
    this.layers.forEach((layer, name) => {
      if (name !== 'header') {
        layer.setScrollPosition(this.scrollX, this.scrollY);
      }
    });
    
    // 在拖动时使用直接跳转策略，在正常滚动时使用预加载策略
    if (this.isDraggingVertical) {
      this.checkAndLoadDataForPosition(this.scrollY);
    } else {
      this.checkAndLoadMoreData();
    }
    
    this.updateScrollbarThumbs();
    this.scheduleRender();
  }

  private setDimensions() {
    const { width, height, showHeader, headerHeight } = this.options;
    const effectiveHeaderHeight = showHeader ? headerHeight : 0;
    const dataHeight = height - effectiveHeaderHeight;

    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;

    this.headerWrapper.style.width = `${width}px`;
    this.headerWrapper.style.height = `${effectiveHeaderHeight}px`;

    this.canvasContainer.style.width = `${width}px`;
    this.canvasContainer.style.height = `${dataHeight}px`;

    this.scrollContainer.style.top = `${effectiveHeaderHeight}px`;
    this.scrollContainer.style.left = `0px`;
    this.scrollContainer.style.width = `${width}px`;
    this.scrollContainer.style.height = `${dataHeight}px`;

    // 修正竖直滚动条轨道只覆盖数据区
    this.verticalScrollbar.style.top = `${effectiveHeaderHeight}px`;
    this.verticalScrollbar.style.height = `${dataHeight}px`;

    // 横向滚动条依然在底部
    this.horizontalScrollbar.style.left = '0';
    this.horizontalScrollbar.style.bottom = '0';
    this.horizontalScrollbar.style.width = `${width}px`;
    this.horizontalScrollbar.style.height = '8px';

    // 计算内容总宽度和高度
    const totalContentWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    const totalContentHeight = this.totalRows * this.options.rowHeight;

    // 判断是否需要显示横向滚动条
    if (totalContentWidth > width) {
      this.horizontalScrollbar.style.opacity = '1';
      this.horizontalScrollbar.style.pointerEvents = 'auto';
    } else {
      this.horizontalScrollbar.style.opacity = '0';
      this.horizontalScrollbar.style.pointerEvents = 'none';
    }

    // 判断是否需要显示纵向滚动条
    if (totalContentHeight > dataHeight) {
      this.verticalScrollbar.style.opacity = '1';
      this.verticalScrollbar.style.pointerEvents = 'auto';
    } else {
      this.verticalScrollbar.style.opacity = '0';
      this.verticalScrollbar.style.pointerEvents = 'none';
    }

    this.layers.forEach((layer, name) => {
      if (name === 'header') {
        layer.setSize(width, effectiveHeaderHeight);
      } else {
        layer.setSize(width, dataHeight);
      }
    });

    this.updateSizer();
    this.updateScrollbarThumbs();

    // 内容区右/下方预留滚动条宽度，避免内容被遮挡
    this.canvasContainer.style.marginRight = this.verticalScrollbar.style.opacity === '1' ? '8px' : '0';
    this.canvasContainer.style.marginBottom = this.horizontalScrollbar.style.opacity === '1' ? '8px' : '0';
  }

  private updateSizer(): void {
    const totalWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    const totalHeight = this.totalRows * this.options.rowHeight;
    this.sizer.style.width = `${totalWidth}px`;
    this.sizer.style.height = `${totalHeight}px`;
  }

  public setColumns(columns: Column[]): void {
    this.columns = columns;
    this.options.columns = columns;
    this.layers.forEach(layer => {
        layer.setColumns(columns);
    });
    this.updateSizer();
    this.scheduleRender();
  }

  public on<K extends keyof TableEventMap>(
    eventName: K,
    callback: (detail: TableEventMap[K]['detail']) => void
  ): void {
    this.eventManager.on(eventName, (event: CustomEvent) => callback(event.detail));
  }

  public setTotalRows(count: number): void {
    this.totalRows = count;
    this.options.totalRows = count;
    this.updateSizer();
    if (count > 0) {
      this.loadInitialData();
    }
  }

  public setDataLoader(loader: DataLoader): void {
    this.dataLoader = loader;
    this.loadInitialData();
  }

  private loadInitialData(): void {
    if (!this.dataLoader || this.totalRows === 0 || this.loadedPages.size > 0) return;
    this.fetchPage(0);
  }

  private checkAndLoadMoreData(): void {
    if (!this.dataLoader || this.isFetching) return;
    const scrollPositionInRows = this.scrollY / this.options.rowHeight;
    const visibleRows = Math.ceil((this.options.height - (this.options.showHeader ? this.options.headerHeight : 0)) / this.options.rowHeight);
    const startRow = Math.floor(scrollPositionInRows);
    const endRow = startRow + visibleRows;
    const preloadThreshold = 400;
    // 计算可见区涉及的页
    const startPage = this.getPageIndex(startRow);
    const endPage = this.getPageIndex(endRow);
    for (let page = startPage; page <= endPage; page++) {
      if (!this.loadedPages.has(page)) {
        this.fetchPage(page);
      }
    }
    // 预加载下一页
    if (!this.loadedPages.has(endPage + 1) && (endRow > (endPage + 1) * this.options.pagination.pageSize - preloadThreshold)) {
      this.fetchPage(endPage + 1);
    }
  }

  private fetchPage(pageIndex: number): Promise<void> {
    if (!this.dataLoader) return Promise.resolve();
    if (this.loadedPages.has(pageIndex)) return Promise.resolve(); // 已加载
    this.isFetching = true;
    const start = pageIndex * this.options.pagination.pageSize;
    const end = Math.min(this.totalRows - 1, start + this.options.pagination.pageSize - 1);
    return this.dataLoader(start, end).then(data => {
      this.loadedPages.set(pageIndex, data);
      this.isFetching = false;
      // 通知数据层刷新
      const dataLayer = this.layers.get('data') as DataLayer;
      if (dataLayer) {
        dataLayer.setDataSource(this.loadedPages, this.getRowData.bind(this), this.scheduleRender.bind(this));
      }
    });
  }

  private updateScrollbarThumbs() {
    // 纵向滑块
    const { height } = this.options;
    const dataHeight = height - (this.options.showHeader ? this.options.headerHeight : 0);
    const totalContentHeight = this.totalRows * this.options.rowHeight;
    if (totalContentHeight > dataHeight) {
      const thumbHeight = Math.max((dataHeight / totalContentHeight) * dataHeight, 30);
      const maxScroll = totalContentHeight - dataHeight;
      // 修正：滑块top严格线性对应scrollY
      let top = 0;
      if (maxScroll > 0) {
        top = (this.scrollY / maxScroll) * (dataHeight - thumbHeight);
      }
      // 调试输出
    //   console.log('[ScrollbarThumbs]', {
    //     scrollY: this.scrollY,
    //     maxScroll,
    //     dataHeight,
    //     totalContentHeight,
    //     thumbHeight,
    //     top
    //   });
      this.verticalThumb.style.height = `${thumbHeight}px`;
      this.verticalThumb.style.top = `${Math.max(0, Math.min(top, dataHeight - thumbHeight))}px`;
    }
    // 横向滑块
    const { width } = this.options;
    const totalContentWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    if (totalContentWidth > width) {
      const thumbWidth = Math.max((width / totalContentWidth) * width, 30);
      const maxScroll = totalContentWidth - width;
      let left = 0;
      if (maxScroll > 0) {
        left = (this.scrollX / maxScroll) * (width - thumbWidth);
      }
      this.horizontalThumb.style.width = `${thumbWidth}px`;
      this.horizontalThumb.style.left = `${Math.max(0, Math.min(left, width - thumbWidth))}px`;
    }
  }

  // 拖动逻辑
  private isDraggingVertical = false;
  private dragStartY = 0;
  private dragStartScrollY = 0;
  private onVerticalThumbMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    this.isDraggingVertical = true;
    this.dragStartY = e.clientY;
    this.dragStartScrollY = this.scrollY;
    document.addEventListener('mousemove', this.onVerticalThumbMouseMove);
    document.addEventListener('mouseup', this.onVerticalThumbMouseUp);
    this.showVerticalScrollbar();
  };
  private onVerticalThumbMouseMove = (e: MouseEvent) => {
    if (!this.isDraggingVertical) return;
    const { height, showHeader, headerHeight } = this.options;
    const effectiveHeaderHeight = showHeader ? headerHeight : 0;
    const dataHeight = height - effectiveHeaderHeight;
    const totalContentHeight = this.totalRows * this.options.rowHeight;
    const thumbHeight = parseFloat(this.verticalThumb.style.height);
    const maxScroll = totalContentHeight - dataHeight;
    const maxThumbTop = dataHeight - thumbHeight;
    const scrollbarRect = this.verticalScrollbar.getBoundingClientRect();
    // 鼠标在数据区轨道内的相对位置
    const mouseY = e.clientY - scrollbarRect.top;
    let newThumbTop = mouseY - thumbHeight / 2;
    newThumbTop = Math.max(0, Math.min(newThumbTop, maxThumbTop));
    const newScrollY = (newThumbTop / maxThumbTop) * maxScroll;
    const limitedScrollY = Math.max(0, Math.min(newScrollY, this.getMaxScrollY()));
    this.updateScrollPosition(this.scrollX, limitedScrollY);
  };
  private onVerticalThumbMouseUp = () => {
    this.isDraggingVertical = false;
    document.removeEventListener('mousemove', this.onVerticalThumbMouseMove);
    document.removeEventListener('mouseup', this.onVerticalThumbMouseUp);
    this.hideVerticalScrollbarDelayed();
  };

  // 横向拖动逻辑
  private isDraggingHorizontal = false;
  private dragStartX = 0;
  private dragStartScrollX = 0;
  private onHorizontalThumbMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    this.isDraggingHorizontal = true;
    this.dragStartX = e.clientX;
    this.dragStartScrollX = this.scrollX;
    document.addEventListener('mousemove', this.onHorizontalThumbMouseMove);
    document.addEventListener('mouseup', this.onHorizontalThumbMouseUp);
  };
  private onHorizontalThumbMouseMove = (e: MouseEvent) => {
    if (!this.isDraggingHorizontal) return;
    const { width } = this.options;
    const totalContentWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    const thumbWidth = parseFloat(this.horizontalThumb.style.width);
    const maxScroll = totalContentWidth - width;
    const maxThumbLeft = width - thumbWidth;
    
    // 计算鼠标在滚动条中的相对位置
    const scrollbarRect = this.horizontalScrollbar.getBoundingClientRect();
    const mouseX = e.clientX - scrollbarRect.left;
    let newThumbLeft = mouseX - thumbWidth / 2;
    newThumbLeft = Math.max(0, Math.min(newThumbLeft, maxThumbLeft));
    
    // 根据滑块位置计算滚动位置
    const newScrollX = (newThumbLeft / maxThumbLeft) * maxScroll;
    this.updateScrollPosition(Math.max(0, Math.min(newScrollX, maxScroll)), this.scrollY);
  };
  private onHorizontalThumbMouseUp = () => {
    this.isDraggingHorizontal = false;
    document.removeEventListener('mousemove', this.onHorizontalThumbMouseMove);
    document.removeEventListener('mouseup', this.onHorizontalThumbMouseUp);
  };

  // 鼠标滚轮支持
  private onMouseWheel = (e: WheelEvent) => {
    const { width, height, showHeader, headerHeight } = this.options;
    const dataHeight = height - (showHeader ? headerHeight : 0);
    const totalContentHeight = this.totalRows * this.options.rowHeight;
    const totalContentWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    let deltaY = e.deltaY;
    let deltaX = e.deltaX;
    if (e.shiftKey) {
      // shift+滚轮横向滚动
      deltaX = deltaY;
      deltaY = 0;
    }
    
    let newScrollY = this.scrollY;
    let newScrollX = this.scrollX;
    
    if (totalContentHeight > dataHeight) {
      newScrollY = Math.max(0, Math.min(this.scrollY + deltaY, this.getMaxScrollY()));
    }
    if (totalContentWidth > width) {
      newScrollX = Math.max(0, Math.min(this.scrollX + deltaX, totalContentWidth - width));
    }
    
    this.updateScrollPosition(newScrollX, newScrollY);
    this.showVerticalScrollbar();
    e.preventDefault();
  };

  // 轨道点击跳转
  private onVerticalTrackMouseDown = (e: MouseEvent) => {
    if (e.target === this.verticalThumb) return;
    const { height, showHeader, headerHeight } = this.options;
    const effectiveHeaderHeight = showHeader ? headerHeight : 0;
    const dataHeight = height - effectiveHeaderHeight;
    const totalContentHeight = this.totalRows * this.options.rowHeight;
    const thumbHeight = parseFloat(this.verticalThumb.style.height);
    const maxScroll = totalContentHeight - dataHeight;
    const maxThumbTop = dataHeight - thumbHeight;
    // 轨道点击的 offsetY 需减去表头高度
    const clickY = e.offsetY;
    let newThumbTop = clickY - thumbHeight / 2;
    newThumbTop = Math.max(0, Math.min(newThumbTop, maxThumbTop));
    const newScrollY = (newThumbTop / maxThumbTop) * maxScroll;
    const limitedScrollY = Math.max(0, Math.min(newScrollY, this.getMaxScrollY()));
    this.updateScrollPosition(this.scrollX, limitedScrollY);
    this.checkAndLoadDataForPosition(limitedScrollY);
    this.showVerticalScrollbar();
  };

  private onHorizontalTrackMouseDown = (e: MouseEvent) => {
    if (e.target === this.horizontalThumb) return;
    const { width } = this.options;
    const totalContentWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    const thumbWidth = parseFloat(this.horizontalThumb.style.width);
    const maxScroll = totalContentWidth - width;
    const maxThumbLeft = width - thumbWidth;
    const clickX = e.offsetX;
    let newThumbLeft = clickX - thumbWidth / 2;
    newThumbLeft = Math.max(0, Math.min(newThumbLeft, maxThumbLeft));
    const newScrollX = (newThumbLeft / maxThumbLeft) * maxScroll;
    this.updateScrollPosition(Math.max(0, Math.min(newScrollX, maxScroll)), this.scrollY);
  };

  // 竖向滚动条自动隐藏逻辑
  private showVerticalScrollbar = () => {
    this.verticalScrollbar.style.opacity = '1';
    if (this.verticalHideTimer) clearTimeout(this.verticalHideTimer);
  };
  private hideVerticalScrollbarDelayed = () => {
    if (this.verticalHideTimer) clearTimeout(this.verticalHideTimer);
    this.verticalHideTimer = setTimeout(() => {
      this.verticalScrollbar.style.opacity = '0';
    }, 1500);
  };

  // 工具函数：根据行号获取页码
  private getPageIndex(rowIndex: number): number {
    return Math.floor(rowIndex / this.options.pagination.pageSize);
  }

  // 工具函数：获取页内偏移
  private getPageOffset(rowIndex: number): number {
    return rowIndex % this.options.pagination.pageSize;
  }

  // 获取某一行数据（如果已加载）
  private getRowData(rowIndex: number): RowData | undefined {
    const pageIndex = this.getPageIndex(rowIndex);
    const page = this.loadedPages.get(pageIndex);
    if (page) {
      return page[this.getPageOffset(rowIndex)];
    }
    return undefined;
  }

  // 重构 checkAndLoadDataForPosition：直接加载目标页
  private checkAndLoadDataForPosition(scrollY: number): void {
    if (!this.dataLoader || this.isFetching) return;
    const scrollPositionInRows = scrollY / this.options.rowHeight;
    const visibleRows = Math.ceil((this.options.height - (this.options.showHeader ? this.options.headerHeight : 0)) / this.options.rowHeight);
    const targetStartRow = Math.floor(scrollPositionInRows);
    const targetEndRow = targetStartRow + visibleRows;
    const startPage = this.getPageIndex(targetStartRow);
    const endPage = this.getPageIndex(targetEndRow);
    for (let page = startPage; page <= endPage; page++) {
      if (!this.loadedPages.has(page)) {
        this.fetchPage(page);
      }
    }
  }

  // 重构 scrollToIndex：直接加载目标页
  public scrollToIndex(index: number): Promise<void> {
    return new Promise((resolve) => {
      const maxScroll = this.getMaxScrollY();
      const targetScrollY = Math.min(index * this.options.rowHeight, maxScroll);
      this.updateScrollPosition(this.scrollX, targetScrollY);
      const pageIndex = this.getPageIndex(index);
      this.fetchPage(pageIndex).then(() => resolve());
    });
  }

  // getCachedDataCount 统计所有已加载行数
  public getCachedDataCount(): number {
    let count = 0;
    this.loadedPages.forEach(arr => count += arr.length);
    return count;
  }

  // clearCache 清空所有页
  public clearCache(): void {
    this.loadedPages.clear();
    this.loadInitialData();
  }

  // 工具函数：获取最大可滚动距离
  private getMaxScrollY(): number {
    const { height, showHeader, headerHeight, totalRows, rowHeight } = this.options;
    const dataHeight = height - (showHeader ? headerHeight : 0);
    const totalContentHeight = totalRows * rowHeight;
    return Math.max(0, totalContentHeight - dataHeight);
  }
} 