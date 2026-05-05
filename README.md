# Twit - シンプルなつぶやきアプリ

X（旧Twitter）風のシンプルなつぶやきアプリです。

## セットアップ

### 1. Supabase プロジェクトの作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. SQL Editor で以下を実行してテーブルを作成:

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  user_email text,
  content text not null,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) を有効化
alter table posts enable row level security;

-- 全員が読める
create policy "誰でも投稿を読める"
  on posts for select using (true);

-- 認証済みユーザーは自分の投稿を作成できる
create policy "自分の投稿を作成できる"
  on posts for insert
  with check (auth.uid() = user_id);

-- 自分の投稿のみ削除できる
create policy "自分の投稿を削除できる"
  on posts for delete
  using (auth.uid() = user_id);
```

3. Project Settings → API から `Project URL` と `anon public key` をコピー

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Supabase の値を入力:

```bash
cp .env.example .env
```

`.env` を編集:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> `.env` は `.gitignore` に含まれているため Git にはアップロードされません。

### 3. ローカル起動

```bash
npm install
npm run dev
```

### 4. Vercel へのデプロイ

1. GitHub にプッシュ
2. [vercel.com](https://vercel.com) でリポジトリをインポート
3. Environment Variables に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定
4. デプロイ

## 機能

- メール/パスワードでのサインアップ・ログイン
- つぶやき投稿（140文字制限）
- リアルタイムでタイムラインを更新
- 自分の投稿を削除
