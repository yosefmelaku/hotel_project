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

  await client.connect()

  const items: Array<[string, string, string, number]> = [
    ['Doro Wat', 'Main Course', 'Spicy chicken stew simmered with berbere, served with injera', 28.0],
    ['Kitfo', 'Main Course', 'Minced beef seasoned with Ethiopian spices and clarified butter', 30.0],
    ['Shiro', 'Main Course', 'Slow-cooked chickpea stew with garlic, onion, and berbere', 18.0],
    ['Tibs', 'Main Course', 'Sauteed beef cubes with rosemary, onion, and peppers', 26.0],
    ['Beyaynetu', 'Vegetarian', 'Colorful platter of lentils, greens, cabbage, and vegetables with injera', 22.0],
    ['Firfir', 'Breakfast', 'Shredded injera mixed with spiced sauce and niter kibbeh', 16.0],
    ['Genfo', 'Breakfast', 'Traditional warm barley porridge served with spiced butter', 14.0],
    ['Injera', 'Bakery', 'Soft sourdough flatbread made from teff flour', 6.0],
    ['Misir Wot', 'Vegetarian', 'Red lentils cooked in berbere sauce and aromatic spices', 17.0],
    ['Atay with Kolo', 'Beverages', 'Ethiopian spiced tea served with roasted barley snack', 8.0],
  ]

  for (const [name, category, description, price] of items) {
    await client.query(
      `INSERT INTO food_types (name, category, description, price, available)
       SELECT $1::varchar, $2::varchar, $3::text, $4::numeric, true
       WHERE NOT EXISTS (
         SELECT 1 FROM food_types WHERE LOWER(name::text) = LOWER($1::text)
       )`,
      [name, category, description, price]
    )
  }

  const result = await client.query(
    `SELECT id, name, category, price
     FROM food_types
     WHERE name IN (
       'Doro Wat', 'Kitfo', 'Shiro', 'Tibs', 'Beyaynetu',
       'Firfir', 'Genfo', 'Injera', 'Misir Wot', 'Atay with Kolo'
     )
     ORDER BY name`
  )

  console.log('Ethiopian menu items available:')
  console.table(result.rows)

  await client.end()
}

main().catch((err) => {
  console.error('Failed to add Ethiopian food:', err)
  process.exitCode = 1
})
