import Mongoose from 'mongoose';

const schema = new Mongoose.Schema({
	uuid: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
});

export const UUID = Mongoose.model('UUID', schema);
