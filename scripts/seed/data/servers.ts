import { Types } from 'mongoose';
import { IServer } from '../../../shared/src/models/server.model';
import { userIds } from './users';

/** Pre-generated ObjectIds so other seed files can reference servers by ID. */
export const serverIds = {
  palletHub: new Types.ObjectId(),
  ceruleanGym: new Types.ObjectId(),
};

export const servers: (IServer & { _id: Types.ObjectId })[] = [
  {
    _id: serverIds.palletHub,
    serverId: '200000000000000001',
    name: 'Pallet Town Trainer Hub',
    adminRoleIds: ['300000000000000001'],
    modRoleIds: ['300000000000000002'],
    discovery: {
      enabled: true,
      description: 'The premier destination for Pokémon trainers starting their journey!',
      icon: 'https://example.com/icons/pallet.png',
      inviteLink: 'https://discord.gg/pallettown',
    },
    playerList: [userIds.ash, userIds.brock],
    prefixes: ['!', '.'],
    regions: [],
  },
  {
    _id: serverIds.ceruleanGym,
    serverId: '200000000000000002',
    name: 'Cerulean City Gym',
    adminRoleIds: ['300000000000000003'],
    modRoleIds: [],
    discovery: {
      enabled: true,
      description: 'Home of the Cascade Badge. Water-type trainers welcome!',
      icon: 'https://example.com/icons/cerulean.png',
      inviteLink: 'https://discord.gg/ceruleangym',
    },
    playerList: [userIds.misty],
    prefixes: ['!'],
    regions: [],
  },
];
