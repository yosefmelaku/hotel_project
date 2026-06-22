import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

export default function AdminDashboard({ token, onLogout }) {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const b = await axios.get('http://localhost:5000/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } })
      const r = await axios.get('http://localhost:5000/api/admin/rooms', { headers: { Authorization: `Bearer ${token}` } })
      setBookings(Array.isArray(b.data) ? b.data : [])
      setRooms(Array.isArray(r.data) ? r.data : [])
    } catch (err) {
      console.error(err)
      alert('Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const t = setTimeout(() => { fetchData() }, 0)
    return () => clearTimeout(t)
  }, [fetchData])

  const updateRoom = async (id, changes) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/rooms/${id}`, changes, { headers: { Authorization: `Bearer ${token}` } })
      setRooms((s) => s.map(r => r.id === id ? res.data : r))
    } catch (err) {
      console.error(err)
      alert('Failed to update room')
    }
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={onLogout}>Logout</button>
        <button onClick={fetchData} style={{ marginLeft: 8 }}>Refresh</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          <section>
            <h3>Bookings</h3>
            <table>
              <thead>
                <tr><th>ID</th><th>Guest</th><th>Room</th><th>Dates</th><th>Price</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.first_name} {b.last_name} ({b.email})</td>
                    <td>{b.room_number} — {b.room_type}</td>
                    <td>{new Date(b.check_in_date).toLocaleDateString()} → {new Date(b.check_out_date).toLocaleDateString()}</td>
                    <td>${Number(b.total_price).toFixed(2)}</td>
                    <td>{b.booking_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginTop: 16 }}>
            <h3>Rooms</h3>
            <table>
              <thead>
                <tr><th>#</th><th>Type</th><th>Price</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.room_number}</td>
                    <td>{r.room_type}</td>
                    <td>
                      <input type="number" defaultValue={r.price_per_night} onBlur={(e) => updateRoom(r.id, { price_per_night: Number(e.target.value) })} />
                    </td>
                    <td>
                      <select defaultValue={r.status} onChange={(e) => updateRoom(r.id, { status: e.target.value })}>
                        <option>Available</option>
                        <option>Occupied</option>
                        <option>Maintenance</option>
                      </select>
                    </td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  )
}
