import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const MAX_CHARS = 140

export default function HomePage({ session }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    fetchPosts()

    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        setPosts(prev => [payload.new, ...prev])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, payload => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error) setPosts(data)
  }

  async function handlePost(e) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || trimmed.length > MAX_CHARS) return

    setPosting(true)
    setError('')

    const { error } = await supabase.from('posts').insert({
      user_id: session.user.id,
      user_email: session.user.email,
      content: trimmed,
    })

    if (error) {
      setError('投稿に失敗しました: ' + error.message)
    } else {
      setContent('')
      textareaRef.current?.focus()
    }

    setPosting(false)
  }

  async function handleDelete(postId) {
    await supabase.from('posts').delete().eq('id', postId)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const remaining = MAX_CHARS - content.length
  const isOverLimit = remaining < 0

  return (
    <div style={styles.layout}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLogo}>𝕏</div>
          <div style={styles.headerRight}>
            <span style={styles.userEmail}>{session.user.email}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>ログアウト</button>
          </div>
        </header>

        <div style={styles.composeArea}>
          <div style={styles.avatar}>{session.user.email[0].toUpperCase()}</div>
          <form onSubmit={handlePost} style={styles.composeForm}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="いまどうしてる？"
              rows={3}
              style={styles.textarea}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(e)
              }}
            />
            {error && <p style={styles.errorText}>{error}</p>}
            <div style={styles.composeFooter}>
              <span style={{ ...styles.charCount, color: isOverLimit ? '#f4212e' : remaining <= 20 ? '#ffd400' : '#71767b' }}>
                {remaining}
              </span>
              <button
                type="submit"
                disabled={posting || !content.trim() || isOverLimit}
                style={{
                  ...styles.postBtn,
                  opacity: posting || !content.trim() || isOverLimit ? 0.5 : 1,
                }}
              >
                {posting ? '投稿中...' : 'つぶやく'}
              </button>
            </div>
          </form>
        </div>

        <div style={styles.divider} />

        <div style={styles.feed}>
          {posts.length === 0 ? (
            <div style={styles.emptyState}>
              <p>まだ投稿がありません</p>
              <p style={{ fontSize: 13, marginTop: 4, color: '#71767b' }}>最初のつぶやきを投稿しましょう！</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={session.user.id}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, currentUserId, onDelete }) {
  const isOwner = post.user_id === currentUserId
  const initial = (post.user_email || '?')[0].toUpperCase()
  const time = formatTime(post.created_at)

  return (
    <div style={styles.post}>
      <div style={styles.avatar}>{initial}</div>
      <div style={styles.postBody}>
        <div style={styles.postHeader}>
          <span style={styles.postEmail}>{post.user_email}</span>
          <span style={styles.postTime}>{time}</span>
          {isOwner && (
            <button onClick={() => onDelete(post.id)} style={styles.deleteBtn} title="削除">✕</button>
          )}
        </div>
        <p style={styles.postContent}>{post.content}</p>
      </div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

const styles = {
  layout: {
    minHeight: '100vh',
    background: '#000',
  },
  container: {
    maxWidth: 600,
    margin: '0 auto',
    borderLeft: '1px solid #2f3336',
    borderRight: '1px solid #2f3336',
    minHeight: '100vh',
  },
  header: {
    position: 'sticky',
    top: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #2f3336',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: 900,
    color: '#e7e9ea',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userEmail: {
    fontSize: 13,
    color: '#71767b',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #2f3336',
    borderRadius: 9999,
    color: '#e7e9ea',
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  composeArea: {
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid #2f3336',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#1d9bf0',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  composeForm: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#e7e9ea',
    fontSize: 18,
    resize: 'none',
    lineHeight: 1.5,
  },
  composeFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    borderTop: '1px solid #2f3336',
    paddingTop: 10,
    marginTop: 4,
  },
  charCount: {
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums',
  },
  postBtn: {
    background: '#1d9bf0',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    borderRadius: 9999,
    padding: '8px 18px',
    transition: 'background 0.15s',
  },
  errorText: {
    color: '#f4212e',
    fontSize: 13,
  },
  divider: {
    height: 8,
    background: '#16181c',
    borderBottom: '1px solid #2f3336',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    padding: '48px 16px',
    textAlign: 'center',
    color: '#e7e9ea',
    fontSize: 17,
    fontWeight: 700,
  },
  post: {
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid #2f3336',
    transition: 'background 0.15s',
  },
  postBody: {
    flex: 1,
    minWidth: 0,
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  postEmail: {
    fontWeight: 700,
    fontSize: 15,
    color: '#e7e9ea',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
  },
  postTime: {
    fontSize: 13,
    color: '#71767b',
    flexShrink: 0,
  },
  deleteBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#71767b',
    fontSize: 12,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#e7e9ea',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}
