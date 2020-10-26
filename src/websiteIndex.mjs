import Express from 'express';
import path from 'path';
import https from 'https';
import http from 'http';
import fs from 'fs';

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
		key: fs.readFileSync('../chatit.site.key'),
		cert: fs.readFileSync('../chatit.site.pem'),
	},
	app
);

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

const httpServer = http.createServer(app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

// app.listen(80, () => console.log('Website is running'));
