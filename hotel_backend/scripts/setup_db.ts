import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

async function main() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE,
  })

  try {
    await client.connect()

    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(50) UNIQUE NOT NULL,
        room_type VARCHAR(100) NOT NULL,
        price_per_night NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Available'
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(200),
        phone VARCHAR(50)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id),
        room_id INTEGER REFERENCES rooms(id),
        check_in_date DATE,
        check_out_date DATE,
        total_price NUMERIC(10,2),
        booking_status VARCHAR(50)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS food_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        available BOOLEAN NOT NULL DEFAULT true
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS hotel_services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        available BOOLEAN NOT NULL DEFAULT true
      )
    `)

    const res = await client.query('SELECT COUNT(*)::int AS cnt FROM rooms')
    const count = res.rows[0].cnt
    if (count === 0) {
      await client.query(`
        INSERT INTO rooms (room_number, room_type, price_per_night, status) VALUES
        ('101','Single',75.00,'Available'),
        ('102','Double',120.00,'Available'),
        ('201','Suite',220.00,'Occupied'),
        ('202','Single',80.00,'Available')
      `)
      console.log('Inserted sample rooms')
    } else {
      console.log('Rooms already present, skipping seed')
    }

    const foodRes = await client.query('SELECT COUNT(*)::int AS cnt FROM food_types')
    if (foodRes.rows[0].cnt === 0) {
      await client.query(`
        INSERT INTO food_types (name, category, description, price, available) VALUES
        ('Continental Breakfast', 'Breakfast', 'Fresh pastries, fruits, juice, and coffee', 18.00, true),
        ('Full English Breakfast', 'Breakfast', 'Eggs, bacon, sausage, beans, and toast', 24.00, true),
        ('Caesar Salad', 'Starters', 'Romaine lettuce, parmesan, croutons, and house dressing', 14.00, true),
        ('Grilled Salmon', 'Main Course', 'Atlantic salmon with seasonal vegetables and lemon butter', 32.00, true),
        ('Beef Steak', 'Main Course', 'Prime cut with mashed potatoes and red wine jus', 45.00, true),
        ('Pasta Carbonara', 'Main Course', 'Creamy pasta with pancetta and parmesan', 22.00, true),
        ('Margherita Pizza', 'Main Course', 'Wood-fired pizza with tomato, mozzarella, and basil', 19.00, true),
        ('Tiramisu', 'Desserts', 'Classic Italian dessert with espresso and mascarpone', 9.00, true),
        ('Chocolate Lava Cake', 'Desserts', 'Warm chocolate cake with vanilla ice cream', 11.00, true)
      `)
      console.log('Inserted sample food types')
    }

    const svcRes = await client.query('SELECT COUNT(*)::int AS cnt FROM hotel_services')
    if (svcRes.rows[0].cnt === 0) {
      await client.query(`
        INSERT INTO hotel_services (name, category, description, price, available) VALUES
        ('24/7 Room Service', 'Dining', 'In-room dining from our full restaurant menu', 0.00, true),
        ('Spa & Wellness', 'Wellness', 'Massage, sauna, and relaxation treatments', 80.00, true),
        ('Fitness Center', 'Wellness', 'Fully equipped gym open daily 6am–10pm', 0.00, true),
        ('Swimming Pool', 'Recreation', 'Heated indoor pool with lounge area', 0.00, true),
        ('Airport Shuttle', 'Transport', 'Scheduled pickup and drop-off to the airport', 25.00, true),
        ('Valet Parking', 'Transport', 'Secure covered parking with valet assistance', 20.00, true),
        ('Laundry & Dry Cleaning', 'Housekeeping', 'Same-day laundry and pressing service', 15.00, true),
        ('Conference Room', 'Business', 'Meeting room with AV equipment for up to 20 guests', 150.00, true),
        ('Concierge', 'Guest Services', 'Tour bookings, reservations, and local recommendations', 0.00, true),
        ('Babysitting', 'Guest Services', 'Professional childcare on request', 35.00, true)
      `)
      console.log('Inserted sample hotel services')
    }

    console.log('DB schema ensured')
  } catch (err) {
    console.error('setup_db error:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
