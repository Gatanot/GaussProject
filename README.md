# GaussProject

这是一个基于 SvelteKit 的示例项目，后端通过 `pg`（Postgres 客户端）连接到 OpenGauss/Postgres 兼容数据库。

以下为快速上手说明，包含如何使用 Docker 启动数据库容器以及如何配置 `.env` 文件。

## 使用 Docker 启动 OpenGauss（快速示例）

推荐先拉取镜像并以最简单方式启动一个本地容器用于开发/测试：

```bash
docker pull opengauss/opengauss:latest
docker run --name opengauss --privileged=true -d -p 5432:5432 --shm-size=4g -e GS_PASSWORD='0316Pro?' opengauss/opengauss:latest
```

说明：
- `-p 5432:5432` 将容器的 5432 端口映射到主机 5432。
- `GS_PASSWORD` 是 OpenGauss 超级用户密码（上面的示例为开发用途，请在生产环境使用更安全的密码并通过秘密管理工具注入）。

如果喜欢使用 docker-compose，可以创建一个简单的 `docker-compose.yml`（示例略）。

等待容器启动后，项目中 `src/lib/server/db.ts` 会使用下列环境变量连接数据库。

## .env 配置

项目仓库包含 `.env.example`（已被跟踪），实际的敏感配置请复制为 `.env` 并修改：

示例 `.env`（仅供本地开发参考）：

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=gaussdb
DB_PASSWORD=0316Pro?
DB_DATABASE=opengauss
DB_MAX_CLIENTS=20
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000
```

说明：
- `DB_HOST` / `DB_PORT`：数据库地址与端口（与 Docker 映射一致）。
- `DB_USER` / `DB_PASSWORD` / `DB_DATABASE`：数据库凭据与名称。
- `.env` 文件被 `.gitignore` 忽略，确保不要将真实密码提交到仓库；仓库中保留的是 `.env.example` 作为模板。

## 本地运行项目（开发）

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

访问 http://localhost:5173 （或 Vite 输出的地址），页面会尝试连接配置好的数据库并显示连接状态。

## 安全与注意事项

- 不要在生产仓库中提交真实密码。生产环境请使用环境变量或秘密管理服务注入配置。
- 如果在不同主机/云环境运行数据库，请确保网络与防火墙规则允许连接并保护好数据库访问。

---

如果需要，我可以：

- 帮你添加一个 `docker-compose.yml` 示例。
- 或将 README 中的示例改为 MySQL / 其他数据库的启动命令。
