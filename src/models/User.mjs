import Mongoose from 'mongoose';

const userSchema = new Mongoose.Schema({
	username: {
		type: String,
		required: true,
		maxlength: 255,
	},
	email: {
		type: String,
		required: true,
		maxlength: 255,
	},
	password: {
		type: String,
		required: true,
		maxlength: 1024,
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

export const User = Mongoose.model('User', userSchema);
