import { Types } from 'mongoose';
import { IUser } from '../../../shared/src/models/user.model';

/** Pre-generated ObjectIds so other seed files can reference users by ID. */
export const userIds = {
  ash: new Types.ObjectId(),
  misty: new Types.ObjectId(),
  brock: new Types.ObjectId(),
};

export const users: (IUser & { _id: Types.ObjectId })[] = [
  {
    _id: userIds.ash,
    userId: '100000000000000001',
    username: 'ash_ketchum',
    globalName: 'Ash Ketchum',
    avatarUrl: 'https://example.com/avatars/ash.png',
    servers: [],
  },
  {
    _id: userIds.misty,
    userId: '100000000000000002',
    username: 'misty_cerulean',
    globalName: 'Misty',
    avatarUrl: 'https://example.com/avatars/misty.png',
    servers: [],
  },
  {
    _id: userIds.brock,
    userId: '100000000000000003',
    username: 'brock_pewter',
    globalName: 'Brock',
    avatarUrl: 'https://example.com/avatars/brock.png',
    servers: [],
  },
];
