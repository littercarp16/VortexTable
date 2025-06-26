// 基础类型定义
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export interface CellData {
  value: string | number;
  rowIndex: number;
  colIndex: number;
  [key: string]: any;
}

export type ColumnType = 'text' | 'number';

export interface Column {
  id: string | number;
  key: string;
  title: string;
  width: number;
  type: ColumnType;
  align: 'left' | 'center' | 'right';
  sortable: boolean;
  filterable: boolean;
  resizable: boolean;
  frozen: boolean;
  hidden: boolean;
}

export interface RowData {
  id: string | number;
  data: {
    [key: string]: string | number;
  }
}

export interface TableOptions {
  width?: number;
  height?: number;
  rowHeight?: number;
  headerHeight?: number;
  totalRows?: number;
  showHeader?: boolean;
  showGrid?: boolean;
  theme?: Theme;
  data?: RowData[];
  columns?: Column[];
  // 虚拟滚动配置
  virtualScroll?: {
    enabled: boolean;
    bufferSize: number; // 缓冲区大小
    estimatedRowHeight?: number; // 预估行高（用于动态高度）
  };
  // 分页配置
  pagination?: {
    enabled: boolean;
    pageSize: number;
    pageNum: number;
    total?: number;
  };
}

export interface Theme {
  font?: string;
  headerFont?: string;
  backgroundColor?: string;
  borderColor?: string;
  gridColor?: string;
  textColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  selectionColor?: string;
  hoverColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  rect: Rect;
}

export type LayerType = 'background' | 'data' | 'interaction' | 'decoration';

export interface EventHandler {
  (event: Event): void;
}

export interface TableEventMap {
  'cell-click': CustomEvent<{ row: number; col: number; cell: CellData }>;
  'selection-change': CustomEvent<{ selection: Selection }>;
  'hover-change': CustomEvent<{ row: number; col: number } | null>;
  'scroll': CustomEvent<{ scrollX: number; scrollY: number }>;
}

// 虚拟滚动相关类型
export interface VirtualScrollInfo {
  startIndex: number;
  endIndex: number;
  visibleCount: number;
  totalHeight: number;
  scrollTop: number;
}

// 数据加载回调
export interface DataLoader {
  (startIndex: number, endIndex: number): Promise<RowData[]>;
}

// 分页信息
export interface PaginationInfo {
  pageNum: number;
  pageSize: number;
  total: number;
  totalPages: number;
} 