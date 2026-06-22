import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [page, setPage] = useState('rooms') // 'rooms' | 'prices' | 'booking'
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
  })

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:5000/api/rooms')
      // some environments (PowerShell tests) may wrap the array in { value: [...] }
      const data = Array.isArray(res.data) ? res.data : (res.data && res.data.value) || []
      setRooms(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // calling fetchRooms here intentionally to load initial data
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms()
  }, [])

  const navigate = (to, room = null) => {
    setSelectedRoom(room)
    setPage(to)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      await axios.post('http://localhost:5000/api/bookings', payload)
      alert('Booking created')
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        room_id: '',
        check_in_date: '',
        check_out_date: '',
      })
      fetchRooms()
    } catch (err) {
      console.error(err)
      alert('Failed to create booking')
    }
  }

  const availableRooms = rooms.filter(r => String(r.status).toLowerCase() === 'available')

  return (
    <div className="app-container">
      <header>
        <h1>Hotel Management Dashboard</h1>
        <nav style={{ marginTop: 8 }}>
          <button onClick={() => navigate('rooms')} style={{ marginRight: 8 }}>Rooms</button>
          <button onClick={() => navigate('prices')} style={{ marginRight: 8 }}>Prices</button>
          <button onClick={() => navigate('booking')}>New Booking</button>
        </nav>
      </header>
      <div className="hero-row" style={{ marginTop: 12 }}>
        <div className="hero-card">
          <img src="/assets/hotel.jpg" alt="Hotel exterior" className="hero-image" />
          <h3>Our Hotel</h3>
        </div>
        <div className="hero-card">
          <img src="/assets/restaurant.jpg" alt="Restaurant" className="hero-image" />
          <h3>Restaurant</h3>
        </div>
      </div>

      <main>
        {page === 'rooms' && (
          <section className="rooms">
            <h2>Rooms</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Room #</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id} style={{ background: selectedRoom && selectedRoom.id === r.id ? '#f0f8ff' : 'transparent' }}>
                      <td>{r.room_number}</td>
                      <td>{r.room_type}</td>
                      <td>${Number(r.price_per_night).toFixed(2)}</td>
                      <td>
                        <span className={`status ${String(r.status).toLowerCase()}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {String(r.status).toLowerCase() === 'available' ? (
                          <button onClick={() => navigate('booking', r)}>Book</button>
                        ) : (
                          <span style={{ color: '#666' }}>Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {page === 'prices' && (
          <section className="prices">
            <h2>Prices</h2>
            {loading ? <p>Loading...</p> : (
              <ul>
                {rooms.map(r => (
                  <li key={r.id}>{r.room_number} — {r.room_type} — ${Number(r.price_per_night).toFixed(2)} {r.status !== 'Available' ? '(Unavailable)' : ''}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {page === 'booking' && (
          <section className="booking">
            {selectedRoom && (
              <div className="selected-room">
                <h3>Selected: {selectedRoom.room_number} — {selectedRoom.room_type}</h3>
                <p>Price per night: ${Number(selectedRoom.price_per_night).toFixed(2)}</p>
                <button onClick={() => setForm((s) => ({ ...s, room_id: selectedRoom.id }))}>Choose this room</button>
              </div>
            )}
            <h2>New Booking</h2>
            <form onSubmit={handleSubmit} className="booking-form">
            <div className="row">
              <input name="first_name" placeholder="First name" value={form.first_name} onChange={handleChange} required />
              <input name="last_name" placeholder="Last name" value={form.last_name} onChange={handleChange} required />
            </div>

            <div className="row">
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            </div>

            <div className="row">
              <input name="check_in_date" type="date" value={form.check_in_date} onChange={handleChange} required />
              <input name="check_out_date" type="date" value={form.check_out_date} onChange={handleChange} required />
            </div>

            <div className="row">
              <select name="room_id" value={form.room_id} onChange={handleChange} required>
                <option value="">Select available room</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} — {r.room_type} — ${Number(r.price_per_night).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <button type="submit">Create Booking</button>
            </div>
          </form>
        </section>
        )}
      </main>

      
    </div>
  )
}

export default App
