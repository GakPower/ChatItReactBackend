import Express from 'express';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { validateJoin, validateLogin } from '../validation';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import uuidLib from 'uuid';
import { UUID } from '../models/UUID.mjs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = Express.Router();

const mailTransport = nodemailer.createTransport({
	host: process.env.SMTP,
	port: 587,
	auth: {
		user: process.env.EMAIL_SECRET,
		pass: process.env.PASS_SECRET,
	},
});

const WEBSITE_PATH = 'http://localhost:3000';

router.post('/join', async (req, res) => {
	const userData = req.body;
	const { valid, field, message } = await validateJoin(userData);
	if (valid) {
		const salt = await bcrypt.genSalt(10);
		const hashedPass = await bcrypt.hash(userData.password, salt);
		try {
			await new User({ ...userData, password: hashedPass }).save();
			res.send({ valid: true });
		} catch (error) {
			res.send({ message: 'A database error has happened. Try again' });
		}
	} else {
		res.send({ field, message });
	}
});

const generateAccessToken = (id) => {
	return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: '30s',
	});
};

router.post('/login', async (req, res) => {
	const { emailLogin, ...userData } = req.body;
	const { valid, id } = await validateLogin(userData, emailLogin);
	if (valid) {
		const accessToken = generateAccessToken(id);
		const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET);
		await new RefreshToken({ accessToken, refreshToken }).save();
		res.send({ valid, token: accessToken });
	} else {
		res.send({
			message: 'Incorrect Email/Username or password',
		});
	}
});

router.delete('/logout', async (req, res) => {
	await RefreshToken.deleteOne({ token: req.body.token });
	res.send({ done: true });
});

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) return res.send('Access Denied. Token not found');

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (error, user) => {
		if (error) {
			if (error.name === 'TokenExpiredError') {
				const { valid, accessToken, message } = await refreshAccessToken(token);

				if (valid) {
					return res.send({ expired: true, token: accessToken });
				} else {
					return res.send({ message });
				}
			} else {
				return res.send({
					message: 'Unknown authentication error. Please login again',
				});
			}
		}

		req.userID = user.id;
		next();
	});
};

router.get('/posts', authenticateToken, async (req, res) => {
	const array = [
		{ name: 'GakPower', film: 'Avengers' },
		{ name: 'finalTest', film: 'Avengers Endgame' },
	];
	const user = await User.findOne({ _id: req.userID });
	res.send({
		valid: true,
		data: array.filter(({ name }) => name === user.username),
	});
});

const refreshAccessToken = async (token) => {
	const doc = await RefreshToken.findOne({ accessToken: token });
	if (!doc) {
		return {
			message: 'Access Denied... Token has expired. Login again',
		};
	}

	try {
		const user = jwt.verify(doc.refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const accessToken = generateAccessToken(user.id);
		await doc.updateOne({ accessToken });
		return { valid: true, accessToken };
	} catch (err) {
		return { message: 'Unknown Error. Login again' };
	}
};

const getExpDateOfDate = (date) => {
	const expDate = date || new Date();
	expDate.setTime(expDate.getTime() + 1800000); // 30mins
	return expDate;
};

router.post('/forgotPass', async (req, res) => {
	const email = req.body.email;
	if (!email) return res.send({});

	const user = await User.findOne({ email });
	if (!user) return res.send({});

	const uuid = uuidLib.v4();
	await new UUID({ uuid, email, expDate: getExpDateOfDate() }).save();

	const message = {
		from: 'gkotDev@gmail.com',
		to: email,
		subject: 'Password Reset',
		text: `
		ChatIt
Hello ${user.username},
It appears you requested a password reset.

Follow the link below to reset your password:
${WEBSITE_PATH}/resetPassword/${uuid}

This link will only be valid for the next 30 minutes.

If you did not make that request, you can ignore this email.

If you have any question just replay to this email

ChatIt 2020 All rights reserved
		`,
		html: `<!DOCTYPE html PUBLIC “-//W3C//DTD XHTML 1.0 Transitional//EN”
		“https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd”>
	
	<html xmlns=“https://www.w3.org/1999/xhtml”>
	
	<head>
	
		<title>ChatIt (Password Reset Email)</title>
	
		<meta http–equiv=“Content-Type” content=“text/html; charset=UTF-8” />
	
		<meta http–equiv=“X-UA-Compatible” content=“IE=edge” />
	
		<meta name=“viewport” content=“width=device-width, initial-scale=1.0 “ />
	
		<style>
			p {
				margin: 0;
			}
		</style>
		
	
	</head>
	
	<body class=”em_body” style="margin:0px; padding:0px; color: #918d7b">
	
	<table bgcolor="#2b2b2b" align=“center” width=“500” border=“0” cellspacing=“0” cellpadding=“0” style=“width:500px;”>
	<tr align="center"><td><p style="font-size: 80px">ChatIt</p></td></tr>
	<tr><p><span style="font-size: 22px; font-weight: bold">Hello ${user.username}</span>,</p></tr>
	<tr><p style="margin-top: 5px;">It appears you requested a password reset.</p></tr>
	<tr><p style="margin-top: 10px;">Click on the button below to reset your password:</p></tr>
	<tr align="center" bgcolor="#ff8966" height="80" width="200"><td aline="center"><a style="color: white; text-decoration:none;" href="${WEBSITE_PATH}/resetPassword/${uuid}" target="_blank">Reset Your Password</a></td></tr>
	<tr><p style="margin-top: 10px; font-size: 12px">Or follow the link below to reset your password:</p></tr>
	<tr><a href="${WEBSITE_PATH}/resetPassword/${uuid}">${WEBSITE_PATH}/resetPassword/${uuid}</a></tr>

	<tr><p style="margin-top: 20px;>This link will only be valid for the next 30 minutes.</p></tr>
	
	<tr><p style="margin-top: 20px; font-size: 12px">If you did not make that request, you can ignore this email.</p></tr>

	<tr><p style="margin-top: 10px;">If you have any question just replay to this email</p></tr>

	<tr align="center" style="margin-top: 20px; font-size: 10px"><td><p>ChatIt 2020 All rights reserved</p></rd></tr>
	
	</table>
	</body>
		`,
	};
	mailTransport.sendMail(message, (error, info) => console.log(error, info));

	return res.send({});
});

router.post('/checkResetId', async (req, res) => {
	const id = req.body.id;
	if (!id) return res.send({});

	const uuidInfo = await UUID.findOne({ uuid: id });
	if (!uuidInfo) return res.send({});

	res.send({ valid: true });
});

router.post('/updatePassword', async (req, res) => {
	const { id, newPassword } = req.body;
	if (!id || !newPassword) {
		return res.send({ message: 'Invalid request. Please try again' });
	}

	const uuidInfo = await UUID.findOne({ uuid: id });
	if (!uuidInfo)
		return res.send({
			message: 'Your password reset request has expired. Please try again.',
		});

	const salt = await bcrypt.genSalt(10);
	const hashedPass = await bcrypt.hash(newPassword, salt);

	const done = await User.updateOne(
		{ email: uuidInfo.email },
		{ password: hashedPass }
	);
	if (done.ok) {
		return res.send({ valid: true });
	} else {
		return res.send({
			message:
				'The user does not exist anymore. Please rejoin us with a new account',
		});
	}
});

const removeExpiredUUIDs = async () => {
	await UUID.deleteMany().where('expDate').lt(new Date());
};
setInterval(() => {
	removeExpiredUUIDs();
	console.log('RUN');
}, 60000);

// const clearDB = () => {
// 	User.deleteMany({}, (error, info) => console.log());
// 	RefreshToken.deleteMany({}, (error, info) => console.log());
// 	UUID.deleteMany({}, (error, info) => console.log());
// };
// clearDB();

export default router;
