---
paths:
  - "apps/backend/src/db/**"
---

# 削除方式（論理削除 vs 物理削除）の選定規約

## 適用条件

DB schema に新しいエンティティテーブルを追加するとき（migration で `CREATE TABLE` するとき）、またはエンティティの削除操作を実装・変更するとき。

## 背景

エンティティテーブルの削除方式が論理削除（`is_deleted` フラグ）と物理削除（`DELETE`）で混在し、その選定根拠が一部テーブルで未文書化のまま割れていた。実態は「物理削除が既定・論理削除が例外」という慣習がコードベース全体で成立していたが、規約として言語化されていなかったため、個々の物理削除テーブルを見ると「なぜ物理か」の根拠が無く恣意的に見えた。本規約はこの非対称を「物理=既定（根拠不要）・論理=例外（根拠必須）」と固定して drift の再発を防ぐ。

## 制約

### 判定軸

削除方式は単一の判定軸で選ぶ:

> **削除後も、その行を参照・名前解決・監査追跡する必要があるか。**

- **No → 物理削除（既定）**: 削除は下流を `ON DELETE CASCADE` で除去する完全除去。関連履歴ごと消えてよい。
- **Yes → 論理削除（例外）**: 不変な履歴レコードが FK 参照する / 同名再作成のため identity を保つ / 過去存在の監査追跡が要る、のいずれかに該当する。

### 1. 物理削除が既定（個別根拠不要）

エンティティテーブルの削除は物理削除を既定とする。物理削除は親削除時に下流を `ON DELETE CASCADE` で除去する完全除去であり、**既定選択そのものに個別の根拠コメントを書かない**（既定を全テーブルで正当化するのは noise ＝ [`documentation-drift-prevention`](documentation-drift-prevention.md) の drift 源）。

### 2. 論理削除は例外（根拠を schema に co-locate 必須）

判定軸が Yes のテーブルのみ論理削除を採用する。実装は `is_deleted BOOLEAN NOT NULL DEFAULT false` フラグ + active フィルタ（`WHERE is_deleted = false`）で行い、必要なら partial unique index（active 行のみ一意）を併設する。**論理削除を採用するテーブルは、その根拠を CREATE / ALTER migration の JS ブロックコメントに co-locate する**（source と根拠を同居させ、判断が後から辿れるようにする）。

### 3. 適用範囲はエンティティテーブルのみ

本規約の対象は**独立したライフサイクルを持つエンティティテーブル**（削除操作の主体になるマスタ／エンティティ）に限る。以下は対象外で、既定の物理削除（多くは親の `ON DELETE CASCADE`）に従う:

- **association**（M2M 中間テーブル）
- **child**（親に従属する行）
- **history**（履歴テーブル）

これらは独立した削除選定を行わず、親の削除方式に従属する。

### 4. enforcement は path-scope ロード + review（メタテストを持たない）

判定軸（監査追跡の要否）は**人間の判断に依存し機械判定できない**ため、自動 enforcement は設けない。「分類の正しさ」は検証不能であり、「例外の根拠コメント存在」の機械検査も安定な小集合に対し over-engineering（YAGNI）。enforcement は本 rule の path-scope 自動ロード + review に委ねる。

## 禁止事項

- 判定軸が No（削除後の参照・名前解決・監査追跡が不要）のエンティティテーブルに、根拠なく論理削除を導入すること（既定は物理削除）。
- 論理削除を採用しながら、その根拠を migration コメントに co-locate しないこと（例外は根拠必須）。
- 物理削除の各テーブルに「なぜ物理か」の個別根拠コメントを撒くこと（既定は本 rule で 1 箇所に言語化済。個別コメントは noise ＋ drift 源）。
- association / child / history テーブルに独立した削除選定・個別根拠を付けること（親従属で対象外）。
- 本 rule 本文に「どのテーブルが論理／物理か」を全 enumerate すること（分類の正は schema の `is_deleted` 列有無 + delete 実装であり drift する。本 rule は選定軸 + 既定/例外規約に留める）。

## 検証

- 新規エンティティテーブルの削除方式が、判定軸に照らして物理（既定）か論理（例外）かを明示的に判断している。
- 論理削除を新規採用した場合、その根拠が CREATE / ALTER migration コメントに co-locate されている。
- 物理削除の新規テーブルに個別根拠コメントが付いていない（既定は本 rule に委譲）。
- association / child / history テーブルに独立した削除選定を持ち込んでいない。

## 関連

- [`documentation-drift-prevention`](documentation-drift-prevention.md)（全テーブル enumerate 回避・既定を全所で正当化しない drift 耐性）
