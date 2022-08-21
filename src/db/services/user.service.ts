import { FilterQuery, HydratedDocument, QueryOptions, UpdateQuery } from "mongoose";
import User, { UserInf } from "../models/user.model";

export async function createUser(input: UserInf) {
    const user: HydratedDocument<UserInf> = new User(input);
    return await user.save();
}

export async function deleteAllUsers() {
    return User.deleteMany({});
}

export async function findUser(
    query: FilterQuery<UserInf>,
    options: QueryOptions = { lean: true }
) {
    return User.findOne(query, null, options);
}

export async function upsertUser(
    query: FilterQuery<UserInf>,
    update: UpdateQuery<UserInf>,
    options: QueryOptions = { lean: true }
) {
    return User.findOneAndUpdate(query, update, options);
}
