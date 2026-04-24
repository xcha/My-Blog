# My-Blog（Next.js + Prisma v7 + PostgreSQL）

一个可上线的全栈博客系统（App Router + TypeScript），包含：

- 邮箱/密码登录注册（NextAuth v5 / Auth.js，JWT Session）
- RBAC 权限（USER/ADMIN）与管理员后台
- 文章发布/置顶/标签、评论与评论治理（屏蔽/恢复/软删除）
- Markdown 写作（实时预览）+ 图片上传（支持拖拽/粘贴）+ 资源管理
- 审计日志（AuditLog）记录关键操作

> 本项目已适配 Prisma ORM v7（driver adapter + 自定义 client 输出 + prisma.config.ts）。

---

## 技术栈

- Next.js（App Router）+ TypeScript
- Prisma ORM v7 + PostgreSQL
- NextAuth v5（Auth.js）+ Credentials Provider + JWT Session
- Tailwind CSS + shadcn/ui + sonner
- Docker（生产部署可选）

---

## 功能概览

### 认证与权限

- 注册 / 登录（邮箱 + 密码）
- Session 注入 `user.id` / `user.role`
- 服务端 RBAC：
  - 未登录 → 重定向 `/login`
  - 非管理员 → `/forbidden`

### 文章

- 作者工作台：新建/编辑/删除、发布（发布即上线）
- 管理员后台：文章列表、置顶、驳回、批量操作
- 标签系统：作者自由输入（逗号分隔），支持标签页聚合

### 评论

- 评论创建、删除权限控制（作者或管理员）
- 评论状态：VISIBLE / HIDDEN / DELETED
- 管理员后台：筛选 + 批量治理（屏蔽/恢复/软删除）

### 图片上传与资源治理

- 上传到 `public/uploads`（Docker 部署使用 volume 持久化）
- Markdown 一键插入图片链接
- `/admin/uploads`：资源列表、删除、引用检测 + 二次确认

### 审计日志

- `/admin/audit`：查看关键操作记录（用户提权、文章/评论治理等）

---

## 目录结构（简化）

```txt
src/
  app/
    api/                # Route Handlers（注册等）
    admin/              # 管理员后台（users/posts/comments/uploads/audit）
    me/                 # 作者工作台（写作中心）
    posts/[slug]/       # 文章详情 + 评论
    tags/               # 标签页
  components/           # UI 组件（MarkdownEditor 等）
  lib/                  # prisma/rbac/audit/slug 等服务端工具
prisma/
  schema.prisma
  migrations/
  seed.ts
prisma.config.ts
```

---

## 环境变量（.env）

本地开发可在项目根目录创建 `.env`：

```env
DATABASE_URL="postgresql://blog_user:your_password@localhost:5432/blog_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_me"

# 可选：seed 初始化管理员（安全模式：存在则跳过）
SEED_ADMIN_EMAIL="admin@lianci.cloud"
SEED_ADMIN_PASSWORD="ChangeMe123456"
SEED_ADMIN_NAME="Admin"
```

> 生产环境（反代 HTTPS）建议：`NEXTAUTH_URL="https://你的域名"`。

---

## 本地运行（不使用 Docker）

### 1）安装依赖

```bash
pnpm install
```

### 2）Prisma（v7）生成/迁移

```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

### 3）初始化管理员（可选）

```bash
pnpm exec prisma db seed
```

### 4）启动开发服务器

```bash
pnpm dev
```

打开：`http://localhost:3000`

---

## 生产部署（Docker + 宝塔反代，推荐实践）

适用于：服务器已经有宝塔占用 80/443；本项目只暴露本机端口（如 4000），由宝塔做域名与 HTTPS。

### 1）docker-compose.yml（关键点）

- web 映射：宿主机 `4000` → 容器 `3000`
- db 不对外暴露（更安全）

示例：

```yaml
services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_DB: blog_db
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: your_strong_password
    volumes:
      - pgdata:/var/lib/postgresql/data

  web:
    build: .
    restart: always
    depends_on:
      - db
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://blog_user:your_strong_password@db:5432/blog_db?schema=public
      NEXTAUTH_URL: https://lianci.cloud
      NEXTAUTH_SECRET: "REPLACE_ME"
      AUTH_TRUST_HOST: "true"
      SEED_ADMIN_EMAIL: admin@lianci.cloud
      SEED_ADMIN_PASSWORD: ChangeMe123456
      SEED_ADMIN_NAME: Admin
    volumes:
      - uploads:/app/public/uploads
    ports:
      - "4000:3000"

volumes:
  pgdata:
  uploads:
```

> 说明：`AUTH_TRUST_HOST=true` 用于反代场景避免 Auth.js v5 的 `UntrustedHost`。

### 2）启动

```bash
docker compose up -d --build
docker compose ps
```

### 3）宝塔反向代理配置

宝塔面板 → 网站 → 你的域名 → 反向代理：

- 目标 URL：`http://127.0.0.1:4000`
- SSL：申请 Let’s Encrypt 并启用

### 4）验证

服务器本机：

```bash
curl -I http://127.0.0.1:4000
```

外网：浏览器打开 `https://你的域名`

---

## 常用运维命令

```bash
# 查看状态
docker compose ps

# 看日志
docker compose logs -f web
docker compose logs -f db

# 重启
docker compose restart web

# 更新代码后重建
docker compose up -d --build
```

---

## 常见问题（Troubleshooting）

### 1）Auth.js 报 UntrustedHost / /api/auth/* 500

- 确保：`NEXTAUTH_URL` 是正确的 https 域名（不要带反引号）
- 反代场景建议加：`AUTH_TRUST_HOST="true"`

### 2）Docker build 阶段报 prerender / ECONNREFUSED（构建时查库）

对所有“会查数据库的公开页面”加：

```ts
export const dynamic = "force-dynamic";
```

（例如：`/`、`/tags`、`/search` 等）

### 3）图片上传后 /uploads 404

- 确认 Docker 使用了 `uploads` volume 持久化
- 如仍 404，可用 Route Handler 兜底静态资源（`src/app/uploads/[...path]/route.ts`）

---

## 管理员初始化与提权

### Seed 创建管理员（推荐）

```bash
pnpm exec prisma db seed
```

### 直接 SQL 提升某账号为 ADMIN（PostgreSQL）

```sql
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "email" = '你的邮箱';
```

> 使用 JWT session 时，提权后需要退出重新登录以刷新 token。

