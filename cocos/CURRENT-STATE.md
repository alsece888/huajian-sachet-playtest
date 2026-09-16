# Cocos 当前状态 · C1

- 用户已确认 V6 功能接近预期，最新要求为使用 Cocos 开发一版。
- 权威工程：D:\我在古代开美妆\cocos\huajian-sachet；V6 网页继续作为玩法基准。
- 引擎固定 Creator 3.8.8；真实 Cocos 2D 渲染、触摸输入、场景组件，无网页嵌入。
- Web Mobile 构建在 build/web-mobile；本地预览 http://127.0.0.1:4174/。
- 规则检查 18/18；触摸检查 12/12；类型检查通过；构建成功退出码 36。
- 验收见 ACCEPTANCE.md；本机证据 evidence/，构建日志 logs/。
- GitHub 外测新地址计划为原站点 /cocos/，V6 根地址保留；发布提交和校验结果见工作区 cocos/PUBLISH-STATE.md。
- 未来需要实体手机反馈。微信/抖音构建尚未做。
- 继续开发直接修改 assets/scripts/game.ts、config.ts、ShopController.ts；不要再次运行工作区 cocos/tools/scaffold.cjs 或 migrate-model.cjs，它们仅为首次迁移工具，会覆盖现有源码/元数据。
