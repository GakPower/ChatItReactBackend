import Express from 'express';
import Mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.mjs';
import appRoutes from './routes/app.mjs';
import socketIO from 'socket.io';
import httpServer from 'http';

dotenv.config();

Mongoose.connect(process.env.DB_CONNECT, { useUnifiedTopology: true }, () =>
	console.log('Connected to DB')
);

const app = Express();
const http = httpServer.createServer(app);

app.use(Express.json());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, OPTIONS, PUT, PATCH, DELETE'
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	next();
});
app.use('/auth', authRoutes);
app.use('/app', appRoutes);

const io = socketIO(http);
io.on('connection', (socket) => {
	socket.on('message', (data) => {
		socket.broadcast.emit('message', data);
	});
});

http.listen(5000, () => console.log('Server is running'));
