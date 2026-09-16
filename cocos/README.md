# 花间香铺 · Cocos 版 C1

Cocos Creator 3.8.8，TypeScript，2D 场景与触摸输入。迁移基准为已确认的网页 V6。

## 打开工程
在 Cocos Dashboard 中导入当前目录（包含 package.json 的 huajian-sachet 文件夹），选择 Creator 3.8.8。
打开 assets/scenes/Shop.scene，点击编辑器预览按钮。
也可使用同目录的“打开Cocos工程”快捷方式（当前电脑路径）。

Shop 场景包含 Canvas、Camera 与 ShopController。ShopController 在运行时创建精灵、顾客、工位、香盘和弹窗；所有游戏界面使用 Cocos Sprite、Label、Graphics，交互使用 Cocos Input 的触摸/鼠标事件。

## 本版玩法
- 一天 3 分钟，从 08:00 营业至 18:00；顾客陆续到店，有独立耐心与表情。
- 红/蓝香囊与 1—4 味配料订单。
- 玫瑰、丁香、薄荷、桂花开放；每篮取五次见底，点击五次补货。
- 多味同称，整批拖入研磨钵或蒸笼。
- 研磨自动开始，5 秒后进入绿区，点击完成；蒸制跟随移动绿区点击到 100%。
- 两份成料放同一盘。香囊也放到香盘，再拖成料入袋，点击袋子画线系紧。
- 拖成品给顾客，正单 24/32/40/48 两；错单收走香囊、不满并仅付 2 两。
- 轻触/悬停工位或材料可看配料；不要的东西拖入废料桶。
- 收铺后可以开下一天，清理工作台、补满库存、保留银子。刷新网页重新开始。
- 设置菜单和切到后台会暂停；系带时营业继续。

## 工程文件
- assets/scripts/game.ts：独立玩法状态与规则。
- assets/scripts/config.ts：玩法参数；数值沿用 V6。
- assets/scripts/ShopController.ts：原生 Cocos 画面、输入、弹窗、反馈。顶部 AREAS 集中定义工位区域。
- assets/scenes/Shop.scene：启动场景。
- assets/resources/art：已有美术图集，使用 SpriteFrame 分区裁切，角色保持宽高比。
- tests/game.test.mjs：18 项规则回归用例。
- build-web.json：Web Mobile 构建配置。
- tools/build-web.ps1：调用已安装的 Creator 构建网页。

## 构建与规则检查
Windows PowerShell：
- 构建：运行 tools/build-web.ps1；Creator 不在默认位置时传入 -CreatorPath。
- 默认 Creator 路径 D:\CocosCreator\3.8.8\CocosCreator.exe，可通过 COCOS_CREATOR_EXE 环境变量覆盖。
- 输出 build/web-mobile。网页需通过 HTTP 服务打开，不能直接双击 index.html。
- 规则检查：在工程目录运行 node tests/run.cjs。使用 Creator 自带 TypeScript 编译器。
- 类型检查：Creator 生成 temp 声明后，使用其 TypeScript 编译器检查 tsconfig.json。

命令行构建依据：[Cocos 官方构建文档](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-in-command-line.html)。

## 验证与范围
18/18 项规则检查通过；浏览器触摸事件实际完成 12 个检查步骤，详见 ACCEPTANCE.md。
当前交付 Cocos 工程与 Web Mobile 试玩构建。尚未构建微信/抖音小游戏或安装包，尚无实体手机样本。
这是玩法迁移版本，沿用 V6 美术和数值；后续可在此工程继续拆分预制体和扩展内容。
