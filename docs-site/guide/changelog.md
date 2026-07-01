# 更新日志

Vue Admin 的所有显著变更均记录在仓库根目录的 [CHANGELOG.md](https://github.com/vue-admin/vue-admin/blob/main/CHANGELOG.md)，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

更新日志由 [git-cliff](https://git-cliff.com/) 基于 Conventional Commits 自动生成，tag 触发时由 CI 同步至根目录并发布 GitHub Release。

## 查看完整变更历史

完整变更历史请前往 GitHub 查看：

→ [CHANGELOG.md](https://github.com/vue-admin/vue-admin/blob/main/CHANGELOG.md)

## 本地查看

```bash
cat CHANGELOG.md          # 查看根目录完整日志
pnpm changelog            # 用 git-cliff 重新生成（写回未发布段）
pnpm release:dry          # 预览未发布段，不写文件
```
