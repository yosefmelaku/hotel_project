import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Simple admin auth: use ADMIN_PASSWORD to mint a static token
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpass';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admintoken';

function checkAdmin(req: Request, res: Response, next: NextFunction) {
	const auth = (req.headers.authorization as string) || '';
	if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
 	const token = auth.slice(7);
 	if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });
 	next();
}

app.get('/api/rooms', async (req: Request, res: Response) => {
	try {
		const result = await pool.query('SELECT * FROM rooms ORDER BY room_number');
		res.json(result.rows);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch rooms' });
	}
});

app.post('/api/bookings', async (req: Request, res: Response) => {
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

// Admin login endpoint (returns static token when password matches)
app.post('/api/admin/login', (req: Request, res: Response) => {
 	const { password } = req.body;
 	if (!password) return res.status(400).json({ error: 'Password required' });
 	if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
 	return res.json({ token: ADMIN_TOKEN });
});

// Admin: list bookings with guest and room info
app.get('/api/admin/bookings', checkAdmin, async (req: Request, res: Response) => {
	try {
		const result = await pool.query(
			`SELECT b.id, b.check_in_date, b.check_out_date, b.total_price, b.booking_status,
							g.first_name, g.last_name, g.email, r.room_number, r.room_type
			 FROM bookings b
			 JOIN guests g ON g.id = b.guest_id
			 JOIN rooms r ON r.id = b.room_id
			 ORDER BY b.id DESC`
		);
		res.json(result.rows);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch bookings' });
	}
});

// Admin: list and update rooms
app.get('/api/admin/rooms', checkAdmin, async (req: Request, res: Response) => {
	try {
		const result = await pool.query('SELECT * FROM rooms ORDER BY room_number');
		res.json(result.rows);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch rooms' });
	}
});

app.put('/api/admin/rooms/:id', checkAdmin, async (req: Request, res: Response) => {
	const { id } = req.params;
	const { price_per_night, status } = req.body;
	try {
		const fields: string[] = [];
		const values: any[] = [];
		let idx = 1;
		if (price_per_night !== undefined) {
			fields.push(`price_per_night = $${idx++}`);
			values.push(price_per_night);
		}
		if (status !== undefined) {
			fields.push(`status = $${idx++}`);
			values.push(status);
		}
		if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
		values.push(id);
		const sql = `UPDATE rooms SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
		const result = await pool.query(sql, values);
		if (result.rowCount === 0) return res.status(404).json({ error: 'Room not found' });
		res.json(result.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to update room' });
	}
});