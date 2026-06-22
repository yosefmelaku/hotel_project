import { useState } from 'react'
import axios from 'axios'

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', { password })
      if (res.data && res.data.token) {
        onLogin(res.data.token)
      } else {
        alert('Login failed')
      }
    } catch (err) {
      console.error(err)
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Admin Login</h2>
      <form onSubmit={submit}>
        <input type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  )
}
