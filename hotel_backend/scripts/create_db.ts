import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

async function main() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    database: 'postgres',
  })

  const dbName = process.env.DB_DATABASE || 'hotel_management'

  try {
    await client.connect()
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`)
    if (res.rowCount > 0) {
      console.log(`Database '${dbName}' already exists`)
    } else {
      await client.query(`CREATE DATABASE ${dbName}`)
      console.log(`Database '${dbName}' created`)
    }
  } catch (err) {
    console.error('create_db error:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
