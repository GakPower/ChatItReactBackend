import Express from 'express';
import Mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.mjs';
import appRoutes from './routes/app.mjs';
import socketIO from 'socket.io';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

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
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	next();
});
app.use('/auth', authRoutes);
app.use('/app', appRoutes);
app.use(Express.static('build'));
app.get('/*', function (req, res) {
	res.sendFile(path.join(path.resolve(), './build/index.html'), function (err) {
		if (err) {
			res.status(500).send(err);
		}
	});
});

const httpsServer = https.createServer(
	{
		key: fs.readFileSync('./chatit.site.key'),
		cert: fs.readFileSync('./chatit.site.pem'),
	},
	app
);
const httpServer = http.createServer(app);

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});
httpServer.listen(80, () => {
	console.log('HTTPS Server running on port 80');
});

const io = socketIO.listen(httpServer);
io.sockets.on('connection', (socket) => {
	socket.on('message', (data) => {
		socket.broadcast.emit('message', data);
	});
});
const httpsIO = socketIO.listen(httpsServer);
httpsIO.sockets.on('connection', (socket) => {
	socket.on('message', (data) => {
		socket.broadcast.emit('message', data);
	});
});
