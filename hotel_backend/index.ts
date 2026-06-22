import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/rooms', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM rooms ORDER BY room_number');
		res.json(result.rows);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch rooms' });
	}
});

app.post('/api/bookings', async (req, res) => {
	const client = await pool.connect();
	try {
		const {
			first_name,
			last_name,
			email,
			phone,
			room_id,
			check_in_date,
			check_out_date,
		} = req.body;

		if (!first_name || !last_name || !email || !room_id || !check_in_date || !check_out_date) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		await client.query('BEGIN');

		const guestInsert = await client.query(
			'INSERT INTO guests (first_name, last_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
			[first_name, last_name, email, phone]
		);
		const guestId = guestInsert.rows[0].id;

		// Get room price to compute total
		const roomRes = await client.query('SELECT price_per_night FROM rooms WHERE id = $1 FOR UPDATE', [room_id]);
		if (roomRes.rowCount === 0) {
			await client.query('ROLLBACK');
			return res.status(404).json({ error: 'Room not found' });
		}
		const pricePerNight = Number(roomRes.rows[0].price_per_night) || 0;

		const ci = new Date(check_in_date);
		const co = new Date(check_out_date);
		const msPerDay = 1000 * 60 * 60 * 24;
		let nights = Math.ceil((co.getTime() - ci.getTime()) / msPerDay);
		if (nights < 1) nights = 1;
		const totalPrice = Number((pricePerNight * nights).toFixed(2));

		const bookingInsert = await client.query(
			'INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, total_price, booking_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
			[guestId, room_id, check_in_date, check_out_date, totalPrice, 'Confirmed']
		);

		await client.query('UPDATE rooms SET status = $1 WHERE id = $2', ['Occupied', room_id]);

		await client.query('COMMIT');

		res.json({ success: true, bookingId: bookingInsert.rows[0].id });
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('Booking error:', err);
		res.status(500).json({ error: 'Failed to create booking' });
	} finally {
		client.release();
	}
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server listening on port ${PORT}`);
});