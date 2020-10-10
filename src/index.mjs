import Express from 'express';
import Mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.mjs';

dotenv.config();

Mongoose.connect(process.env.DB_CONNECT, { useUnifiedTopology: true }, () =>
	console.log('Connected to DB')
);

const app = Express();

app.use(Express.json());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, OPTIONS, PUT, PATCH, DELETE'
	);
	// res.header(
	// 	'Access-Control-Allow-Methods',
	// 	'GET, POST, OPTIONS, PUT, PATCH, DELETE'
	// );
	// res.header('Access-Control-Allow-Headers', 'Content-Type');
	// res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	next();
});
app.use('/api/auth', authRoutes);

app.listen(5000, () => console.log('Server is running'));
