import Express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router = Express.Router();

let emojis;

const getAllEmojis = () => {
	fetch(`https://emoji-api.com/emojis?access_key=${process.env.EMOJI_KEY}`)
		.then((res) => res.json())
		.then((list) => {
			const readyList = list
				.map((emoji) => {
					const value = emoji.codePoint.split(' ').map((part) => `0x${part}`);
					try {
						return String.fromCodePoint(...value);
					} catch (error) {}
				})
				.filter((emojiCode) => emojiCode);

			emojis = readyList;
		});
};
getAllEmojis();

router.get('/emojis', (req, res) => {
	res.send({ emojis });
});

export default router;
