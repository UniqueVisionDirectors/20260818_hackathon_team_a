---
name: check-local
description: ローカル実機での動作確認。確認項目の洗い出し→環境準備→実行→判定まで計画的に行う。静的解析・自動テストは扱わない(それは quality-check の領分)
user-invocable: true
---

# ローカル実機での動作確認

## トリガー

ユーザーが今回の変更の動作確認(実機)を依頼したとき。`/check-local` で明示的に呼び出す。

> 静的解析・自動テスト(lint / type-check / knip / test)は本 skill の範囲外。それは [quality-check](../quality-check/SKILL.md) の領分。本 skill は **実機での振る舞い確認** に専念する。

## ⚠️ 絶対遵守(最優先・例外なし)

**ローカル環境の起動(docker compose up)とテストデータの整備(seed)は、いかなる場合も Claude(あなた)の仕事である。ユーザーに委譲・依頼・肩代わりさせてはならない。**

- ユーザーが「自分で実機確認する」と述べても、それは **section 3 の目視確認をユーザーが担う** という意味であり、**環境起動・seed・migration・API probe を Claude が行う義務は消えない**。目視の主体が誰であれ、環境準備は必ず Claude が完了させてから引き渡す。
- 「環境が無い/用意が要る/ユーザーに任せた方が早い」を、環境起動を省く理由にしてはならない。まず自分で `docker compose up --build -d` を実行し、seed 状態を確認し、health / API probe まで済ませる。
- この項目は過去に繰り返し怠られた実績があるため、**最優先の遵守事項**として本 skill の全手順に優先する。着手時にまず本項目の充足(環境起動 + seed 確認)を確認せよ。

## アクション(計画 → 準備 → 実行 → 判定)

`.claude/rules/verification.md`(計画→実行→判定)に従う。

### 1. 確認項目の洗い出し(MECE)

今回の変更が影響する機能を特定し、確認項目を **正常系 / 異常系 / 境界値** で網羅的に列挙する。この 3 区分は最低限の floor であり、変更固有のリスクから確認項目を動的に追加する([`coverage-floor-not-ceiling`](../../rules/coverage-floor-not-ceiling.md))。各項目に **実行前に合否基準(期待結果)を定義** する。出力は表で管理する:

| 項番 | 操作 | 期待結果 | 実測 | 合否 |
|---|---|---|---|---|

**3D(Babylon.js)描画に関わる変更を含む場合の floor**: 以下 7 項目(`DESIGN.md` §11 のブラウザ検証)を必ず確認項目に組み込む。変更が renderer / BabylonCanvas / engine 選択に触れない場合は該当項目を「対象外」と明記してスキップ可:

1. WebGL で Scene が描画され、camera 操作できる
2. Canvas resize 後に縦横比が維持される
3. route 遷移と HMR 後に render loop が重複しない
4. background tab で描画が停止し、復帰後に再開する
5. WebGPU 指定時に対応環境では WebGPU、非対応環境では WebGL にフォールバックする
6. context lost / restored 後も Engine 標準処理で復帰する
7. reduced motion / keyboard focus / mobile pointer 操作を確認する

### 2. 準備(あなたが全て行う)

**大原則: あなたが実行できることは、すべてあなたが実行する。** 環境の起動・seed 確認・CLI で実行可能な確認(probe / API 呼び出し)は、自分で出来る部分を必ず自分で進める。「ユーザーに任せた方が早い/確実」を理由に丸投げしない。ユーザーへ委譲してよいのは section 3 の **実機画面(ブラウザ)を通じた目視確認に限る**。

**委譲前プリフライト(3 点すべてを満たすまで section 3 へ進まない):**

1. ローカル環境を **自分で docker compose 起動したか**(未起動のまま「環境が無い/用意が要る」を委譲理由にしない)。
2. CLI で実行可能な手順(probe / API 呼び出し)を **自分で実行し判定したか**(実行できるものをユーザーに代行させていないか)。
3. 残った「ユーザーへの依頼」が、本当に **実機画面の目視確認だけ** に絞り込まれているか(自動化可能な操作が紛れていないか)。

**起動(root `compose.yml`。サービス: frontend / backend / postgres / minio):**

```bash
docker compose up --build -d   # 全サービス起動。初回起動時に migration + デモユーザーが自動投入される
docker compose ps              # 稼働確認
docker compose logs -f backend # ログ確認
```

- **seed**: 初回起動時に migration + デモユーザー(`test1@example.com` / `password123`)が自動投入される。追加 seed スクリプトは無い。データを作り直したいときは `docker compose down -v` 後に再 `up`。
- **ホスト側ポートは `.env` が正**(未作成なら `.env.example` の既定 = frontend 15173 / backend 13000 / postgres 15432 / minio API 19000 / console 19001)。
- **backend / frontend は必ず docker compose のコンテナとして起動する**(host 側 `npm run dev` での直接起動は禁止)。確認環境をコンテナ実行時と一致させるため。

**CLI で実行可能な確認(自分で行う):**

```bash
curl http://localhost:13000/health                 # backend health(応答 200)
# API 動作: http://localhost:13000/swagger-ui(Swagger UI)/ http://localhost:13000/doc(OpenAPI JSON)
PGPASSWORD=password psql -h localhost -p 15432 -U postgres -d dev   # DB 確認
```

### 3. 私への依頼(実機画面の目視確認だけ)

私が行うのは **ブラウザ実機画面を通じた挙動の目視確認のみ**(WebGL/WebGPU 描画・camera 操作・resize・reduced motion 等、原理的に自動化不能な確認を含む)。それ以外(環境起動・CLI 実行・判定)は section 2 で全てあなたが終わらせる。CLI で実行できる確認をここに混ぜない。依頼は **一つずつ**、具体的な操作手順と「何が見えれば合格か」を添えて出す(frontend は `http://localhost:15173`、デモログイン `test1@example.com` / `password123`)。

### 4. 判定

各項目を事前の合否基準に照らして判定し、表を埋める。正常系だけで完了とせず、異常系・境界値も必ず確認する。

## 制約

- 確認漏れのない計画を立ててから着手する(「とりあえず動かす」を禁ずる)。
- **backend / frontend は必ず docker compose のコンテナとして起動する**(host 側 `npm run dev` での直接起動は禁止)。確認環境をコンテナ実行時と一致させるため。

## 禁止事項

- **CLI で実行可能なコマンド/スクリプト(probe・API 呼び出し・DB 確認等)をユーザーに代行させること。** 実行できるものは必ず自分が実行・判定する。委譲してよいのは原理的に自動化不能な操作(実機画面の目視確認 = WebGL/WebGPU 描画・camera/pointer 操作等、人間の手・目を要するもの)だけ。
- ローカル環境を **自分で起動せずに**「環境が無い/用意が要る」を理由に確認をユーザーへ丸投げすること。
- 正常系だけ確認して異常系・境界値の確認をユーザー任せ・未実施で完了とすること。

## 検証

- 着手後の操作履歴に、**自分による** `docker compose up` と CLI 確認(health probe / API 実行)の実行痕跡がある。
- ユーザーへの依頼が、実機画面の目視確認(WebGL/WebGPU 描画確認等の自動化不能操作)のみに絞られている(CLI で回せる手順を含んでいない)。
- 確認項目テーブルが正常系 / 異常系 / 境界値を網羅し、各項目に事前定義の合否基準と実測・合否が埋まっている。3D 描画に関わる変更では `DESIGN.md` §11 の 7 項目が組み込まれている。
