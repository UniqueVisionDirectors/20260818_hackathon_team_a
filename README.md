# Babylon.jsサンプルアプリケーション

## はじめに

以下の1~3の手順に従ってローカル環境へアクセスしてください
ブラウザ上で回転する多角形を確認出来たら完了です

1. 起動する

以下のコマンドを実行する
```sh
docker compose up --build -d
```

2. アクセスする

[https://localhost:](http://localhost:15173/)にブラウザでアクセスする

3. ログインする

以下の情報でログインする
```txt
mail: test1@example.com
password: password123
```

## 技術

Vue 3、Babylon.js、Hono、PostgreSQL、MinIOで構成するWeb 3Dアプリケーションテンプレートです。
元の `vue_hono_postgres` が提供する認証、CRUD、OpenAPI、画像アップロードを維持し、
フロントエンドへフレームワーク非依存の3Dレンダリング層を追加しています。

詳細な責務分割と拡張方針は [DESIGN.md](./DESIGN.md) を参照してください。

### バージョン方針

- Node.jsは要件に合わせて24系の最新LTS patchである`24.18.0`に固定しています。
- PostgreSQLは正式リリースの最新安定版`18.4`を利用します（19 betaは採用しません）。
- npm packageは2026-07-17時点のlatestを採用しています。
- フロントエンドのTypeScriptのみ、`vue-tsc 3.3.7`がTypeScript 7のpackage exportに未対応のため、最新互換版`6.0.3`を採用しています。バックエンドは`7.0.2`です。
- Node型定義は実行環境に合わせ、24系の最新`@types/node 24.13.3`を利用します。

主要バージョンはNode `24.18.0`、npm `12.0.1`、Vue `3.5.40`、Babylon.js `9.17.0`、
Vite `8.1.5`、Hono `4.12.30`、PostgreSQL `18.4`です。

### 構成

```text
Browser
  ├─ Vue 3: UI、ルーティング、Pinia
  └─ Babylon.js: Canvas、Scene、render loop
       ↓ HTTP
Hono + OpenAPI + Zod
  ├─ PostgreSQL: ユーザー、アイテム、画像メタデータ
  └─ MinIO: 画像オブジェクト
```

Babylon.js はモノリシックな `babylonjs` ではなく、ESM の
`@babylonjs/core` と `@babylonjs/loaders` を利用します。

### 起動

```sh
docker compose up --build
```

ホスト側ポートを変更する場合は、`.env.example`を`.env`へコピーして値を変更します。
コンテナ間通信のポートは変わりません。

初回起動時にマイグレーションとデモユーザーの作成が行われます。

| サービス | URL |
|---|---|
| フロントエンド | <http://localhost:15173/> |
| Hono API | <http://localhost:13000/> |
| Swagger UI | <http://localhost:13000/swagger-ui> |
| MinIO Console | <http://localhost:19001/> |

このワークスペースでは他プロジェクトとのポート競合を避けるため、現在の`.env`で
Frontend `15173`、API `13000`、PostgreSQL `15432`、MinIO `19000/19001`
として起動しています。

デモログイン:

- Email: `test1@example.com`
- Password: `password123`

停止:

```sh
docker compose stop
```

コンテナと開発データを削除:

```sh
docker compose down -v
```

### ローカル実行

PostgreSQL と MinIO を用意した上で、別々のターミナルから実行します。

```sh
cd apps/backend
npm ci
npm run dev
```

```sh
cd apps/frontend
cp .env.example .env
npm ci
npm run dev
```

### レンダリングバックエンド

標準は WebGL です。

```env
VITE_BABYLON_RENDERER=webgl
```

WebGPU を試す場合:

```env
VITE_BABYLON_RENDERER=webgpu
```

WebGPU が未対応、または初期化に失敗した場合は WebGL へフォールバックします。
WebGPU は動的 import のため、WebGL 利用時の初期チャンクには含まれません。

### 3Dコードの入口

| ファイル | 責務 |
|---|---|
| `apps/frontend/src/components/BabylonCanvas.vue` | Vue lifecycle、resize、visibility、状態表示 |
| `apps/frontend/src/renderer/BabylonRenderer.ts` | Engine / Scene / render loop の所有と破棄 |
| `apps/frontend/src/renderer/createEngine.ts` | WebGL / WebGPU の生成とフォールバック |
| `apps/frontend/src/renderer/createDemoScene.ts` | カメラ、ライト、PBRメッシュ、アニメーション |

glTF / GLB は `BabylonRenderer.loadGltf()` からロードできます。
loader は呼び出された時だけ動的に読み込まれます。

### 検証

```sh
cd apps/frontend
npm run build
npm run knip

cd ../backend
npm run build
npm test
```

Docker Compose の設定確認:

```sh
docker compose config
```

### DBアクセス

```sh
PGPASSWORD=password psql -h localhost -p "${POSTGRES_PORT:-15432}" -U postgres -d dev
```
