import Express from 'express';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { validateJoin, validateLogin } from '../validation';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Express.Router();

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

export default router;
