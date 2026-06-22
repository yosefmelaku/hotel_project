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

    console.log('DB schema ensured')
  } catch (err) {
    console.error('setup_db error:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
