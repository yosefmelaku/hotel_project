import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

function App() {
  const [rooms, setRooms] = useState([])
  const [foodTypes, setFoodTypes] = useState([])
  const [services, setServices] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [page, setPage] = useState('rooms')
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '')
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
    try {
      const res = await axios.get('http://localhost:5000/api/rooms')
      const data = Array.isArray(res.data) ? res.data : (res.data && res.data.value) || []
      setRooms(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchFoodTypes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/food-types')
      const data = Array.isArray(res.data) ? res.data : (res.data && res.data.value) || []
      setFoodTypes(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchServices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/services')
      const data = Array.isArray(res.data) ? res.data : (res.data && res.data.value) || []
      setServices(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchCatalog = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchRooms(), fetchFoodTypes(), fetchServices()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCatalog()
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

  const groupByCategory = (items) => {
    return items.reduce((groups, item) => {
      const cat = item.category || 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
      return groups
    }, {})
  }

  const foodByCategory = groupByCategory(foodTypes)
  const servicesByCategory = groupByCategory(services)

  return (
    <div className="app-container">
      <header className="hero-banner" role="img" aria-label="Hotel exterior">
        <div className="hero-overlay">
          <h1>Grand Horizon Hotel</h1>
          <p className="hero-tagline">Elegant rooms, fine dining, and seamless reservations — all in one place.</p>
          <nav className="main-nav">
            <button className={`nav-button ${page === 'rooms' ? 'active' : ''}`} onClick={() => navigate('rooms')}>Rooms</button>
            <button className={`nav-button ${page === 'dining' ? 'active' : ''}`} onClick={() => navigate('dining')}>Dining</button>
            <button className={`nav-button ${page === 'services' ? 'active' : ''}`} onClick={() => navigate('services')}>Services</button>
            <button className={`nav-button ${page === 'prices' ? 'active' : ''}`} onClick={() => navigate('prices')}>Prices</button>
            <button className={`nav-button ${page === 'booking' ? 'active' : ''}`} onClick={() => navigate('booking')}>New Booking</button>
            <button className={`nav-button ${page === 'admin' ? 'active admin-btn' : 'admin-btn'}`} onClick={() => navigate('admin')}>Admin</button>
          </nav>
        </div>
      </header>

      <section className="hero-row" aria-label="Hotel amenities">
        <article className="hero-card">
          <img src="/assets/hotel.jpg" alt="Luxury hotel lobby" className="hero-image" />
          <div className="hero-card-body">
            <h3>Luxury Rooms</h3>
            <p>Comfortable suites with premium amenities and city views.</p>
          </div>
        </article>
        <article className="hero-card">
          <img src="/assets/restaurant.jpg" alt="Fine dining restaurant" className="hero-image" />
          <div className="hero-card-body">
            <h3>Fine Dining</h3>
            <p>Seasonal cuisine and an award-winning wine selection.</p>
          </div>
        </article>
      </section>

      <main>
        {page === 'admin' && (
          <section className="admin">
            {!adminToken ? (
              <AdminLogin onLogin={(t) => { setAdminToken(t); localStorage.setItem('adminToken', t); }} />
            ) : (
              <AdminDashboard token={adminToken} onLogout={() => { setAdminToken(''); localStorage.removeItem('adminToken'); }} />
            )}
          </section>
        )}

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
                    <tr key={r.id} style={{ background: selectedRoom && selectedRoom.id === r.id ? 'var(--accent-bg)' : 'transparent' }}>
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

        {page === 'dining' && (
          <section className="dining">
            <h2>Restaurant Menu</h2>
            <p className="section-intro">Explore our fine dining options, from breakfast to dessert.</p>
            {loading ? <p>Loading...</p> : (
              Object.keys(foodByCategory).length === 0 ? (
                <p>No menu items available.</p>
              ) : (
                Object.entries(foodByCategory).map(([category, items]) => (
                  <div key={category} className="catalog-group">
                    <h3 className="catalog-category">{category}</h3>
                    <div className="catalog-grid">
                      {items.map((item) => (
                        <article key={item.id} className="catalog-card">
                          <div className="catalog-card-header">
                            <h4>{item.name}</h4>
                            <span className="catalog-price">${Number(item.price).toFixed(2)}</span>
                          </div>
                          {item.description && <p>{item.description}</p>}
                        </article>
                      ))}
                    </div>
                  </div>
                ))
              )
            )}
          </section>
        )}

        {page === 'services' && (
          <section className="services">
            <h2>Hotel Services</h2>
            <p className="section-intro">Amenities and guest services available during your stay.</p>
            {loading ? <p>Loading...</p> : (
              Object.keys(servicesByCategory).length === 0 ? (
                <p>No services available.</p>
              ) : (
                Object.entries(servicesByCategory).map(([category, items]) => (
                  <div key={category} className="catalog-group">
                    <h3 className="catalog-category">{category}</h3>
                    <div className="catalog-grid">
                      {items.map((item) => (
                        <article key={item.id} className="catalog-card">
                          <div className="catalog-card-header">
                            <h4>{item.name}</h4>
                            <span className="catalog-price">
                              {Number(item.price) === 0 ? 'Complimentary' : `$${Number(item.price).toFixed(2)}`}
                            </span>
                          </div>
                          {item.description && <p>{item.description}</p>}
                        </article>
                      ))}
                    </div>
                  </div>
                ))
              )
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
