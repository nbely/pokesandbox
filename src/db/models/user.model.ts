import { HydratedDocument, Model, model, Query, Schema } from "mongoose";

export interface UserInf {
	userId: string,
	userName: string,
	userTag: string
}

type UserModelType = Model<UserInf, UserQueryHelpers>;
type UserModelQuery = Query<any, HydratedDocument<UserInf>, UserQueryHelpers> & UserQueryHelpers;
interface UserQueryHelpers {
	byUsername(this: UserModelQuery, username: string): UserModelQuery;
} 

export const UserSchema: Schema = new Schema({
	userId: { type: String, required: true },
	userName: { type: String, required: true },
	userTag: { type: String, required: true }
});

const UserModel = model<UserInf, UserModelType>('User', UserSchema);

export default UserModel;
