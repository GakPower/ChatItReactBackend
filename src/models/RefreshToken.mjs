import Mongoose from 'mongoose';

const schema = new Mongoose.Schema({
	accessToken: {
		type: String,
		required: true,
	},
	refreshToken: {
		type: String,
		required: true,
	},
});

export const RefreshToken = Mongoose.model('RefreshToken', schema);
