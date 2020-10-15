import Joi from '@hapi/joi';
import { User } from './models/User';
import bcrypt from 'bcrypt';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/i;

const usernameSchema = Joi.string().required().not('@').max(255);
const emailSchema = Joi.string().required().pattern(emailRegex).max(255);
const passwordSchema = Joi.string().required().min(8).max(1024);

const joinSchema = Joi.object({
	username: usernameSchema,
	email: emailSchema,
	password: passwordSchema,
});
export const validateJoin = async (userData) => {
	const usernameExists = await User.findOne({
		username: userData.username,
	});
	if (usernameExists) {
		return {
			valid: false,
			field: 'username',
			message: 'Username has already been taken',
		};
	}

	const emailExists = await User.findOne({
		email: userData.email,
	});
	if (emailExists) {
		return {
			valid: false,
			field: 'email',
			message: 'Email is already in use',
		};
	}
	return { valid: !joinSchema.validate(userData).error };
};

export const validateLogin = async (userData, emailLogin) => {
	const schema = emailLogin ? emailSchema : usernameSchema;
	const field = userData.emailUsername;
	const fieldObject = emailLogin ? { email: field } : { username: field };

	if (schema.validate(field).error) {
		return { valid: false };
	}

	const user = await User.findOne(fieldObject);
	if (!user) {
		return { valid: false };
	}

	const validPass = await bcrypt.compare(userData.password, user.password);
	return { valid: validPass, id: user._id };
};

export const validatePass = async (newPassword) => {
	return { valid: !passwordSchema.validate(newPassword).error };
};
