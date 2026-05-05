import { useState } from 'react'
import { supabase } from './supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('確認メールを送信しました。メールをご確認ください。')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>𝕏</div>
        <h1 style={styles.title}>
          {mode === 'login' ? 'ログイン' : 'アカウント作成'}
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
          style={styles.switchBtn}
        >
          {mode === 'login' ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: '#000',
    border: '1px solid #2f3336',
    borderRadius: 16,
    padding: '40px 32px',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  logo: {
    fontSize: 40,
    fontWeight: 900,
    color: '#e7e9ea',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e7e9ea',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: '1px solid #2f3336',
    borderRadius: 8,
    color: '#e7e9ea',
    fontSize: 15,
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: '#e7e9ea',
    color: '#000',
    fontWeight: 700,
    fontSize: 15,
    borderRadius: 9999,
    marginTop: 4,
    transition: 'opacity 0.15s',
  },
  switchBtn: {
    background: 'none',
    color: '#1d9bf0',
    fontSize: 13,
    cursor: 'pointer',
    border: 'none',
    padding: 0,
  },
  error: {
    color: '#f4212e',
    fontSize: 13,
    textAlign: 'center',
  },
  success: {
    color: '#00ba7c',
    fontSize: 13,
    textAlign: 'center',
  },
}
