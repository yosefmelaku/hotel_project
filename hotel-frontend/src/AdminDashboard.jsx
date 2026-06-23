import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000'

export default function AdminDashboard({ token, onLogout }) {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [foodTypes, setFoodTypes] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [foodForm, setFoodForm] = useState({ name: '', category: '', description: '', price: '' })
  const [serviceForm, setServiceForm] = useState({ name: '', category: '', description: '', price: '' })

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [b, r, f, s] = await Promise.all([
        axios.get(`${API}/api/admin/bookings`, { headers }),
        axios.get(`${API}/api/admin/rooms`, { headers }),
        axios.get(`${API}/api/admin/food-types`, { headers }),
        axios.get(`${API}/api/admin/services`, { headers }),
      ])
      setBookings(Array.isArray(b.data) ? b.data : [])
      setRooms(Array.isArray(r.data) ? r.data : [])
      setFoodTypes(Array.isArray(f.data) ? f.data : [])
      setServices(Array.isArray(s.data) ? s.data : [])
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
      const res = await axios.put(`${API}/api/admin/rooms/${id}`, changes, { headers })
      setRooms((s) => s.map(r => r.id === id ? res.data : r))
    } catch (err) {
      console.error(err)
      alert('Failed to update room')
    }
  }

  const updateFood = async (id, changes) => {
    try {
      const res = await axios.put(`${API}/api/admin/food-types/${id}`, changes, { headers })
      setFoodTypes((s) => s.map(f => f.id === id ? res.data : f))
    } catch (err) {
      console.error(err)
      alert('Failed to update food item')
    }
  }

  const updateService = async (id, changes) => {
    try {
      const res = await axios.put(`${API}/api/admin/services/${id}`, changes, { headers })
      setServices((s) => s.map(item => item.id === id ? res.data : item))
    } catch (err) {
      console.error(err)
      alert('Failed to update service')
    }
  }

  const addFood = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/api/admin/food-types`, {
        ...foodForm,
        price: Number(foodForm.price),
      }, { headers })
      setFoodTypes((s) => [...s, res.data])
      setFoodForm({ name: '', category: '', description: '', price: '' })
    } catch (err) {
      console.error(err)
      alert('Failed to add food item')
    }
  }

  const addService = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/api/admin/services`, {
        ...serviceForm,
        price: Number(serviceForm.price) || 0,
      }, { headers })
      setServices((s) => [...s, res.data])
      setServiceForm({ name: '', category: '', description: '', price: '' })
    } catch (err) {
      console.error(err)
      alert('Failed to add service')
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
            <div className="table-wrap">
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
            </div>
          </section>

          <section style={{ marginTop: 16 }}>
            <h3>Rooms</h3>
            <div className="table-wrap">
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
            </div>
          </section>

          <section style={{ marginTop: 16 }}>
            <h3>Food Menu</h3>
            <form onSubmit={addFood} className="admin-inline-form">
              <input placeholder="Name" value={foodForm.name} onChange={(e) => setFoodForm(s => ({ ...s, name: e.target.value }))} required />
              <input placeholder="Category" value={foodForm.category} onChange={(e) => setFoodForm(s => ({ ...s, category: e.target.value }))} required />
              <input placeholder="Description" value={foodForm.description} onChange={(e) => setFoodForm(s => ({ ...s, description: e.target.value }))} />
              <input type="number" step="0.01" placeholder="Price" value={foodForm.price} onChange={(e) => setFoodForm(s => ({ ...s, price: e.target.value }))} required />
              <button type="submit">Add Item</button>
            </form>
            <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th></tr>
              </thead>
              <tbody>
                {foodTypes.map(f => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.category}</td>
                    <td>
                      <input type="number" step="0.01" defaultValue={f.price} onBlur={(e) => updateFood(f.id, { price: Number(e.target.value) })} />
                    </td>
                    <td>
                      <select defaultValue={f.available ? 'yes' : 'no'} onChange={(e) => updateFood(f.id, { available: e.target.value === 'yes' })}>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>

          <section style={{ marginTop: 16 }}>
            <h3>Hotel Services</h3>
            <form onSubmit={addService} className="admin-inline-form">
              <input placeholder="Name" value={serviceForm.name} onChange={(e) => setServiceForm(s => ({ ...s, name: e.target.value }))} required />
              <input placeholder="Category" value={serviceForm.category} onChange={(e) => setServiceForm(s => ({ ...s, category: e.target.value }))} required />
              <input placeholder="Description" value={serviceForm.description} onChange={(e) => setServiceForm(s => ({ ...s, description: e.target.value }))} />
              <input type="number" step="0.01" placeholder="Price (0 = free)" value={serviceForm.price} onChange={(e) => setServiceForm(s => ({ ...s, price: e.target.value }))} />
              <button type="submit">Add Service</button>
            </form>
            <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th></tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.category}</td>
                    <td>
                      <input type="number" step="0.01" defaultValue={s.price} onBlur={(e) => updateService(s.id, { price: Number(e.target.value) })} />
                    </td>
                    <td>
                      <select defaultValue={s.available ? 'yes' : 'no'} onChange={(e) => updateService(s.id, { available: e.target.value === 'yes' })}>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
