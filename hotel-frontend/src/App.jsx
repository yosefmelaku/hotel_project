import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import ThemeToggle from './ThemeToggle'

function App() {
  const [rooms, setRooms] = useState([])
  const [foodTypes, setFoodTypes] = useState([])
  const [services, setServices] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [page, setPage] = useState('home')
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '')
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light'
  )

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
  })
  const [roomFilter, setRoomFilter] = useState('all')
  const [foodCart, setFoodCart] = useState({})
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [orderGuest, setOrderGuest] = useState({ guest_name: '', room_number: '' })
  const [submittingOrder, setSubmittingOrder] = useState(false)

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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const navigate = (to, room = null) => {
    setSelectedRoom(room)
    setPage(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
  const unavailableRooms = rooms.filter(r => String(r.status).toLowerCase() !== 'available')

  const isRoomAvailable = (room) => String(room.status).toLowerCase() === 'available'

  const filteredRooms = rooms.filter((r) => {
    if (roomFilter === 'available') return isRoomAvailable(r)
    if (roomFilter === 'unavailable') return !isRoomAvailable(r)
    return true
  })

  const roomStats = {
    total: rooms.length,
    available: availableRooms.length,
    unavailable: unavailableRooms.length,
  }

  const addFoodToCart = (item) => {
    setFoodCart((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }))
  }

  const removeFoodFromCart = (itemId) => {
    setFoodCart((prev) => {
      const next = { ...prev }
      if (!next[itemId]) return next
      if (next[itemId] <= 1) delete next[itemId]
      else next[itemId] -= 1
      return next
    })
  }

  const foodCartItems = foodTypes
    .filter((f) => foodCart[f.id])
    .map((f) => ({
      id: f.id,
      name: f.name,
      price: Number(f.price),
      quantity: foodCart[f.id],
    }))

  const foodCartTotal = foodCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id))
  const servicesTotal = selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0)

  const handleOrderGuestChange = (e) => {
    const { name, value } = e.target
    setOrderGuest((s) => ({ ...s, [name]: value }))
  }

  const placeFoodOrder = async (e) => {
    e.preventDefault()
    if (foodCartItems.length === 0) {
      alert('Please add food items to your order')
      return
    }
    if (!orderGuest.guest_name.trim()) {
      alert('Please enter your name')
      return
    }
    setSubmittingOrder(true)
    try {
      await axios.post('http://localhost:5000/api/food-orders', {
        guest_name: orderGuest.guest_name.trim(),
        room_number: orderGuest.room_number.trim() || null,
        items: foodCartItems,
      })
      alert('Food order placed! It will be prepared soon.')
      setFoodCart({})
    } catch (err) {
      console.error(err)
      alert('Failed to place food order')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const submitServiceRequest = async (e) => {
    e.preventDefault()
    if (selectedServices.length === 0) {
      alert('Please select at least one service')
      return
    }
    if (!orderGuest.guest_name.trim()) {
      alert('Please enter your name')
      return
    }
    setSubmittingOrder(true)
    try {
      await axios.post('http://localhost:5000/api/service-requests', {
        guest_name: orderGuest.guest_name.trim(),
        room_number: orderGuest.room_number.trim() || null,
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price || 0),
        })),
      })
      alert('Service request submitted! Our team will contact you shortly.')
      setSelectedServiceIds([])
    } catch (err) {
      console.error(err)
      alert('Failed to submit service request')
    } finally {
      setSubmittingOrder(false)
    }
  }

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
            <button className={`nav-button ${page === 'home' ? 'active' : ''}`} onClick={() => navigate('home')}>Home</button>
            <button className={`nav-button ${page === 'rooms' ? 'active' : ''}`} onClick={() => navigate('rooms')}>Rooms</button>
            <button className={`nav-button ${page === 'dining' ? 'active' : ''}`} onClick={() => navigate('dining')}>Dining</button>
            <button className={`nav-button ${page === 'services' ? 'active' : ''}`} onClick={() => navigate('services')}>Services</button>
            <button className={`nav-button ${page === 'prices' ? 'active' : ''}`} onClick={() => navigate('prices')}>Prices</button>
            <button className={`nav-button ${page === 'booking' ? 'active' : ''}`} onClick={() => navigate('booking')}>New Booking</button>
            <button className={`nav-button ${page === 'admin' ? 'active admin-btn' : 'admin-btn'}`} onClick={() => navigate('admin')}>Admin</button>
            <ThemeToggle theme={theme} onToggle={setTheme} />
          </nav>
        </div>
      </header>

      <main className="page-content">
        {page === 'home' && (
          <section className="home page-panel">
            <h2>Welcome to Grand Horizon Hotel</h2>
            <p className="section-intro">
              Your destination for luxury accommodations, fine dining, and exceptional service.
              Browse our rooms, explore the menu, and book your stay — all in one place.
            </p>

            {!loading && (
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-value">{roomStats.available}</span>
                  <span className="stat-label">Rooms Available</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{foodTypes.length}</span>
                  <span className="stat-label">Menu Items</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{services.length}</span>
                  <span className="stat-label">Hotel Services</span>
                </div>
              </div>
            )}

            <div className="hero-row" aria-label="Hotel highlights">
              <article className="hero-card">
                <img src="/assets/hotel.jpg" alt="Luxury hotel lobby" className="hero-image" />
                <div className="hero-card-body">
                  <h3>Luxury Rooms</h3>
                  <p>Comfortable suites with premium amenities and city views.</p>
                  <button type="button" className="card-link-btn" onClick={() => navigate('rooms')}>View Rooms</button>
                </div>
              </article>
              <article className="hero-card">
                <img src="/assets/restaurant.jpg" alt="Fine dining restaurant" className="hero-image" />
                <div className="hero-card-body">
                  <h3>Fine Dining</h3>
                  <p>Seasonal cuisine and an award-winning wine selection.</p>
                  <button type="button" className="card-link-btn" onClick={() => navigate('dining')}>View Menu</button>
                </div>
              </article>
            </div>

            <div className="home-links">
              <h3>Explore the Hotel</h3>
              <div className="home-links-grid">
                <button type="button" className="home-link-card" onClick={() => navigate('rooms')}>
                  <span className="home-link-title">Rooms</span>
                  <span className="home-link-desc">Browse available suites and room types</span>
                </button>
                <button type="button" className="home-link-card" onClick={() => navigate('dining')}>
                  <span className="home-link-title">Dining</span>
                  <span className="home-link-desc">Restaurant menu and fine dining options</span>
                </button>
                <button type="button" className="home-link-card" onClick={() => navigate('services')}>
                  <span className="home-link-title">Services</span>
                  <span className="home-link-desc">Amenities and guest services</span>
                </button>
                <button type="button" className="home-link-card" onClick={() => navigate('prices')}>
                  <span className="home-link-title">Prices</span>
                  <span className="home-link-desc">Room rates and nightly pricing</span>
                </button>
                <button type="button" className="home-link-card home-link-card--accent" onClick={() => navigate('booking')}>
                  <span className="home-link-title">New Booking</span>
                  <span className="home-link-desc">Reserve your stay today</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {page === 'admin' && (
          <section className="admin admin-boundary" aria-label="Staff administration area">
            <div className="admin-boundary-badge">Staff Area</div>
            <div className="admin-boundary-inner">
              {!adminToken ? (
                <AdminLogin onLogin={(t) => { setAdminToken(t); localStorage.setItem('adminToken', t); }} />
              ) : (
                <AdminDashboard token={adminToken} onLogout={() => { setAdminToken(''); localStorage.removeItem('adminToken'); }} />
              )}
            </div>
          </section>
        )}

        {page === 'rooms' && (
          <section className="rooms page-panel">
            <h2>Rooms</h2>
            <p className="section-intro">View all rooms with live availability. Available rooms can be booked directly.</p>

            {!loading && (
              <div className="stats-row stats-row--compact">
                <div className="stat-card stat-card--available">
                  <span className="stat-value">{roomStats.available}</span>
                  <span className="stat-label">Available</span>
                </div>
                <div className="stat-card stat-card--unavailable">
                  <span className="stat-value">{roomStats.unavailable}</span>
                  <span className="stat-label">Not Available</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{roomStats.total}</span>
                  <span className="stat-label">Total Rooms</span>
                </div>
              </div>
            )}

            <div className="filter-tabs">
              <button type="button" className={`filter-tab ${roomFilter === 'all' ? 'active' : ''}`} onClick={() => setRoomFilter('all')}>All ({roomStats.total})</button>
              <button type="button" className={`filter-tab ${roomFilter === 'available' ? 'active' : ''}`} onClick={() => setRoomFilter('available')}>Available ({roomStats.available})</button>
              <button type="button" className={`filter-tab ${roomFilter === 'unavailable' ? 'active' : ''}`} onClick={() => setRoomFilter('unavailable')}>Not Available ({roomStats.unavailable})</button>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : filteredRooms.length === 0 ? (
              <p className="empty-state">No rooms match this filter.</p>
            ) : (
              <>
                <div className="room-grid">
                  {filteredRooms.map((r) => (
                    <article key={r.id} className={`room-card ${isRoomAvailable(r) ? 'room-card--available' : 'room-card--unavailable'}`}>
                      <div className="room-card-top">
                        <h3>Room {r.room_number}</h3>
                        <span className={`status ${String(r.status).toLowerCase()}`}>{r.status}</span>
                      </div>
                      <p className="room-card-type">{r.room_type}</p>
                      <p className="room-card-price">${Number(r.price_per_night).toFixed(2)} <span>/ night</span></p>
                      {isRoomAvailable(r) ? (
                        <button type="button" onClick={() => navigate('booking', r)}>Book This Room</button>
                      ) : (
                        <span className="room-unavailable-label">Currently unavailable</span>
                      )}
                    </article>
                  ))}
                </div>

                <div className="table-wrap">
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
                  {filteredRooms.map((r) => (
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
                        {isRoomAvailable(r) ? (
                          <button onClick={() => navigate('booking', r)}>Book</button>
                        ) : (
                          <span className="unavailable-text">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </>
            )}
          </section>
        )}

        {page === 'prices' && (
          <section className="prices page-panel">
            <h2>Prices</h2>
            <p className="section-intro">Room rates with clear availability. Only available rooms can be booked.</p>
            {loading ? <p>Loading...</p> : (
              <>
                <div className="price-section">
                  <h3 className="price-section-title">Available Rooms</h3>
                  {availableRooms.length === 0 ? (
                    <p className="empty-state">No rooms available right now.</p>
                  ) : (
                    <ul>
                      {availableRooms.map(r => (
                        <li key={r.id}>
                          <span>{r.room_number} — {r.room_type}</span>
                          <span className="price-line">
                            <strong>${Number(r.price_per_night).toFixed(2)}</strong>
                            <span className="status available">Available</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="price-section">
                  <h3 className="price-section-title">Not Available</h3>
                  {unavailableRooms.length === 0 ? (
                    <p className="empty-state">All rooms are currently available.</p>
                  ) : (
                    <ul>
                      {unavailableRooms.map(r => (
                        <li key={r.id} className="price-item--unavailable">
                          <span>{r.room_number} — {r.room_type}</span>
                          <span className="price-line">
                            <strong>${Number(r.price_per_night).toFixed(2)}</strong>
                            <span className={`status ${String(r.status).toLowerCase()}`}>{r.status}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {page === 'dining' && (
          <section className="dining page-panel">
            <h2>Restaurant Menu</h2>
            <p className="section-intro">Choose food items and place your order. Your selection will be prepared soon.</p>
            {loading ? <p>Loading...</p> : (
              Object.keys(foodByCategory).length === 0 ? (
                <p className="empty-state">No menu items available.</p>
              ) : (
                <>
                {Object.entries(foodByCategory).map(([category, items]) => (
                  <div key={category} className="catalog-group">
                    <h3 className="catalog-category">{category}</h3>
                    <div className="catalog-grid">
                      {items.map((item) => (
                        <article key={item.id} className={`catalog-card ${foodCart[item.id] ? 'catalog-card--selected' : ''}`}>
                          <div className="catalog-card-header">
                            <h4>{item.name}</h4>
                            <span className="catalog-price">${Number(item.price).toFixed(2)}</span>
                          </div>
                          {item.description && <p>{item.description}</p>}
                          <div className="catalog-actions">
                            <button type="button" className="btn-secondary" onClick={() => removeFoodFromCart(item.id)} disabled={!foodCart[item.id]}>−</button>
                            <span className="qty-badge">{foodCart[item.id] || 0}</span>
                            <button type="button" onClick={() => addFoodToCart(item)}>Add</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="order-panel">
                  <h3>Your Food Order</h3>
                  {foodCartItems.length === 0 ? (
                    <p className="empty-state">No items selected yet. Add food from the menu above.</p>
                  ) : (
                    <ul className="order-list">
                      {foodCartItems.map((item) => (
                        <li key={item.id}>
                          <span>{item.name} × {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="order-total">Total: <strong>${foodCartTotal.toFixed(2)}</strong></p>
                  <form onSubmit={placeFoodOrder} className="order-form">
                    <div className="row">
                      <input name="guest_name" placeholder="Your name" value={orderGuest.guest_name} onChange={handleOrderGuestChange} required />
                      <input name="room_number" placeholder="Room number (optional)" value={orderGuest.room_number} onChange={handleOrderGuestChange} />
                    </div>
                    <button type="submit" disabled={submittingOrder || foodCartItems.length === 0}>
                      {submittingOrder ? 'Placing order...' : 'Place Food Order'}
                    </button>
                  </form>
                </div>
                </>
              )
            )}
          </section>
        )}

        {page === 'services' && (
          <section className="services page-panel">
            <h2>Hotel Services</h2>
            <p className="section-intro">Select services you want during your stay and submit a request.</p>
            {loading ? <p>Loading...</p> : (
              Object.keys(servicesByCategory).length === 0 ? (
                <p className="empty-state">No services available.</p>
              ) : (
                <>
                {Object.entries(servicesByCategory).map(([category, items]) => (
                  <div key={category} className="catalog-group">
                    <h3 className="catalog-category">{category}</h3>
                    <div className="catalog-grid">
                      {items.map((item) => {
                        const selected = selectedServiceIds.includes(item.id)
                        return (
                        <article key={item.id} className={`catalog-card catalog-card--selectable ${selected ? 'catalog-card--selected' : ''}`}>
                          <label className="service-select-label">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleService(item.id)}
                            />
                            <div className="catalog-card-header">
                              <h4>{item.name}</h4>
                              <span className="catalog-price">
                                {Number(item.price) === 0 ? 'Complimentary' : `$${Number(item.price).toFixed(2)}`}
                              </span>
                            </div>
                            {item.description && <p>{item.description}</p>}
                          </label>
                        </article>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="order-panel">
                  <h3>Selected Services</h3>
                  {selectedServices.length === 0 ? (
                    <p className="empty-state">No services selected. Check the services you want above.</p>
                  ) : (
                    <ul className="order-list">
                      {selectedServices.map((item) => (
                        <li key={item.id}>
                          <span>{item.name}</span>
                          <span>{Number(item.price) === 0 ? 'Free' : `$${Number(item.price).toFixed(2)}`}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="order-total">Total: <strong>{servicesTotal === 0 ? 'Complimentary' : `$${servicesTotal.toFixed(2)}`}</strong></p>
                  <form onSubmit={submitServiceRequest} className="order-form">
                    <div className="row">
                      <input name="guest_name" placeholder="Your name" value={orderGuest.guest_name} onChange={handleOrderGuestChange} required />
                      <input name="room_number" placeholder="Room number (optional)" value={orderGuest.room_number} onChange={handleOrderGuestChange} />
                    </div>
                    <button type="submit" disabled={submittingOrder || selectedServices.length === 0}>
                      {submittingOrder ? 'Submitting...' : 'Request Services'}
                    </button>
                  </form>
                </div>
                </>
              )
            )}
          </section>
        )}

        {page === 'booking' && (
          <section className="booking page-panel">
            {selectedRoom && (
              <div className="selected-room">
                <h3>Selected: {selectedRoom.room_number} — {selectedRoom.room_type}</h3>
                <p>Price per night: ${Number(selectedRoom.price_per_night).toFixed(2)}</p>
                <button onClick={() => setForm((s) => ({ ...s, room_id: selectedRoom.id }))}>Choose this room</button>
              </div>
            )}
            <h2>New Booking</h2>
            <p className="section-intro">Fill in your details and select an available room to complete your reservation.</p>

            {(foodCartItems.length > 0 || selectedServices.length > 0) && (
              <div className="booking-extras">
                <h3>Your selections</h3>
                {foodCartItems.length > 0 && (
                  <div className="booking-extras-block">
                    <h4>Food order (${foodCartTotal.toFixed(2)})</h4>
                    <ul className="order-list">
                      {foodCartItems.map((item) => (
                        <li key={item.id}><span>{item.name} × {item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)}</span></li>
                      ))}
                    </ul>
                    <button type="button" className="btn-link" onClick={() => navigate('dining')}>Edit food order</button>
                  </div>
                )}
                {selectedServices.length > 0 && (
                  <div className="booking-extras-block">
                    <h4>Services ({servicesTotal === 0 ? 'Complimentary' : `$${servicesTotal.toFixed(2)}`})</h4>
                    <ul className="order-list">
                      {selectedServices.map((item) => (
                        <li key={item.id}><span>{item.name}</span><span>{Number(item.price) === 0 ? 'Free' : `$${Number(item.price).toFixed(2)}`}</span></li>
                      ))}
                    </ul>
                    <button type="button" className="btn-link" onClick={() => navigate('services')}>Edit services</button>
                  </div>
                )}
              </div>
            )}

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
