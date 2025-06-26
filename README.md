# VortexTable

一个基于Canvas的高性能表格组件，使用TypeScript开发，采用OOP架构和分层Canvas设计。

## 特性

- 🎨 **分层Canvas渲染** - 背景层、数据层、交互层、装饰层分离，性能优化
- 🔧 **TypeScript支持** - 完整的类型定义，开发体验更佳
- ⚡ **高性能** - 只重绘需要更新的层，支持大数据量渲染
- 🎯 **交互丰富** - 支持单元格选择、拖拽选择、悬停效果
- 🎨 **主题定制** - 灵活的主题配置系统
- 📦 **模块化设计** - 易于扩展和维护
- 🚀 **原生JavaScript** - 无框架依赖，轻量级

## 架构设计

### 分层Canvas架构

```
┌─────────────────────────────────────┐
│           装饰层 (z-index: 3)        │  ← 选择框、悬停效果
├─────────────────────────────────────┤
│           交互层 (z-index: 2)        │  ← 鼠标事件、拖拽
├─────────────────────────────────────┤
│           数据层 (z-index: 1)        │  ← 文本、网格线
├─────────────────────────────────────┤
│           背景层 (z-index: 0)        │  ← 背景色、边框
└─────────────────────────────────────┘
```

### 核心类结构

```
VortexTable (主控制器)
├── Layer (抽象层基类)
│   ├── BackgroundLayer (背景层)
│   ├── DataLayer (数据层)
│   ├── InteractionLayer (交互层)
│   └── DecorationLayer (装饰层)
├── Renderer (渲染引擎)
├── EventManager (事件管理器)
└── 工具类
    ├── Geometry (几何计算)
    ├── TextRenderer (文本渲染)
    └── ColorUtils (颜色工具)
```

## 快速开始

### 基础用法

```html
<!DOCTYPE html>
<html>
<head>
    <title>VortexTable Demo</title>
</head>
<body>
    <div id="table-container"></div>
    
    <script type="module">
        import { VortexTable } from './dist/index.js';
        
        const container = document.getElementById('table-container');
        const table = new VortexTable(container, {
            width: 800,
            height: 400,
            rowHeight: 35,
            colWidth: 120,
            showHeader: true,
            showGrid: true
        });
        
        // 设置数据
        const data = [
            [
                { value: '张三', rowIndex: 0, colIndex: 0 },
                { value: '25', rowIndex: 0, colIndex: 1 },
                { value: '北京', rowIndex: 0, colIndex: 2 }
            ],
            [
                { value: '李四', rowIndex: 1, colIndex: 0 },
                { value: '30', rowIndex: 1, colIndex: 1 },
                { value: '上海', rowIndex: 1, colIndex: 2 }
            ]
        ];
        
        table.setData(data);
    </script>
</body>
</html>
```

### 高级配置

```typescript
import { VortexTable, type TableOptions, type Theme } from './dist/index.js';

const theme: Theme = {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    textColor: '#333333',
    headerBackgroundColor: '#f8f9fa',
    headerTextColor: '#495057',
    selectionColor: 'rgba(0, 123, 255, 0.3)',
    hoverColor: 'rgba(0, 123, 255, 0.1)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 14
};

const options: TableOptions = {
    width: 1000,
    height: 600,
    rowHeight: 40,
    colWidth: 150,
    headerHeight: 50,
    showHeader: true,
    showGrid: true,
    theme: theme
};

const table = new VortexTable(container, options);
```

## API 文档

### VortexTable

主表格类，负责协调各层渲染和事件处理。

#### 构造函数

```typescript
new VortexTable(container: HTMLElement, options?: TableOptions)
```

#### 方法

- `setData(data: CellData[][])` - 设置表格数据
- `getData(): CellData[][]` - 获取表格数据
- `setSelection(selection: Selection | null)` - 设置选择区域
- `getSelection(): Selection | null` - 获取当前选择
- `render()` - 手动触发渲染
- `destroy()` - 销毁表格实例
- `getOptions(): Required<TableOptions>` - 获取配置选项
- `getEventManager(): EventManager` - 获取事件管理器

### 事件

```typescript
// 监听单元格点击
table.getEventManager().addEventListener('cell-click', (event) => {
    console.log('点击的单元格:', event.detail);
});

// 监听选择变化
table.getEventManager().addEventListener('selection-change', (event) => {
    console.log('选择区域:', event.detail.selection);
});

// 监听滚动
table.getEventManager().addEventListener('scroll', (event) => {
    console.log('滚动位置:', event.detail);
});
```

## 类型定义

### TableOptions

```typescript
interface TableOptions {
    width?: number;           // 表格宽度
    height?: number;          // 表格高度
    rowHeight?: number;       // 行高
    colWidth?: number;        // 列宽
    headerHeight?: number;    // 表头高度
    showHeader?: boolean;     // 是否显示表头
    showGrid?: boolean;       // 是否显示网格线
    theme?: Theme;            // 主题配置
    data?: CellData[][];      // 初始数据
}
```

### Theme

```typescript
interface Theme {
    backgroundColor?: string;        // 背景色
    borderColor?: string;           // 边框色
    textColor?: string;             // 文本色
    headerBackgroundColor?: string; // 表头背景色
    headerTextColor?: string;       // 表头文本色
    selectionColor?: string;        // 选择区域颜色
    hoverColor?: string;            // 悬停颜色
    fontFamily?: string;            // 字体
    fontSize?: number;              // 字体大小
}
```

### CellData

```typescript
interface CellData {
    value: string | number;  // 单元格值
    rowIndex: number;        // 行索引
    colIndex: number;        // 列索引
    [key: string]: any;      // 其他属性
}
```

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
VortexTable/
├── src/
│   ├── core/                 # 核心类
│   │   ├── Table.ts         # 主表格类
│   │   ├── Layer.ts         # 抽象层基类
│   │   ├── Renderer.ts      # 渲染引擎
│   │   └── EventManager.ts  # 事件管理器
│   ├── layers/              # 具体层实现
│   │   ├── BackgroundLayer.ts
│   │   ├── DataLayer.ts
│   │   ├── InteractionLayer.ts
│   │   └── DecorationLayer.ts
│   ├── types/               # 类型定义
│   │   └── index.ts
│   └── index.ts             # 主入口
├── examples/                # 示例
│   └── basic.html
├── tests/                   # 测试
├── dist/                    # 构建输出
├── package.json
├── tsconfig.json
└── README.md
```

## 性能优化

1. **分层渲染** - 只重绘需要更新的层
2. **脏标记** - 避免不必要的重绘
3. **对象池** - 减少内存分配
4. **事件节流** - 优化交互性能
5. **虚拟滚动** - 支持大数据量（计划中）

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 基础表格功能
- 分层Canvas架构
- TypeScript支持
- 事件系统
- 主题配置 