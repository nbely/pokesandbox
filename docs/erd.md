# Entity Relationship Diagram

**Generated:** 2026-02-27T22:21:12.865Z

## Diagram

```mermaid
erDiagram
    User {
        string avatarUrl
        string globalName
        Server[] servers
        string userId
        string username
    }

    Server {
        string serverId
        string[] adminRoleIds
        object discovery
        string discovery_description
        boolean discovery_enabled
        string discovery_icon
        string discovery_inviteLink
        string[] modRoleIds
        string name
        User[] playerList
        string[] prefixes
        Region[] regions
    }

    Region {
        number baseGeneration
        number charactersPerPlayer
        Character[] characterList
        string currencyType
        boolean deployable
        boolean deployed
        object graphicSettings
        boolean graphicSettings_backSpritesEnabled
        boolean graphicSettings_frontSpritesEnabled
        boolean graphicSettings_iconSpritesEnabled
        string graphicSettings_mapImageLink
        Location[] locations
        string name
        object[] pokedex
        ObjectId pokedex_id
        string pokedex_name
        Map progressionDefinitions
        object quests
        Quest[] quests_active
        Quest[] quests_passive
        number quests_maxPassiveQuests
        Shop[] shops
        string[] transportationTypes
    }

    User ||--o{ Server : "servers"
    Server ||--o{ User : "playerList"
    Server ||--o{ Region : "regions"
    Region ||--o{ Character : "characterList"
    Region ||--o{ Location : "locations"
    Region ||--o{ DexEntry : "pokedex_id"
    Region ||--o{ Quest : "quests_active"
    Region ||--o{ Quest : "quests_passive"
    Region ||--o{ Shop : "shops"
```

## Entities

### User

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `avatarUrl` | string |  |  |
| `globalName` | string | ✓ |  |
| `servers` | Server[] | ✓ | References: Server |
| `userId` | string | ✓ |  |
| `username` | string | ✓ |  |

### Server

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `serverId` | string | ✓ |  |
| `adminRoleIds` | string[] | ✓ |  |
| `discovery` | object | ✓ |  |
| `↳ description` | string |  |  |
| `↳ enabled` | boolean | ✓ |  |
| `↳ icon` | string |  |  |
| `↳ inviteLink` | string |  |  |
| `modRoleIds` | string[] | ✓ |  |
| `name` | string | ✓ |  |
| `playerList` | User[] | ✓ | References: User |
| `prefixes` | string[] | ✓ |  |
| `regions` | Region[] | ✓ | References: Region |

### Region

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `baseGeneration` | number | ✓ |  |
| `charactersPerPlayer` | number | ✓ |  |
| `characterList` | Character[] |  | References: Character |
| `currencyType` | string | ✓ |  |
| `deployable` | boolean | ✓ |  |
| `deployed` | boolean | ✓ |  |
| `graphicSettings` | object | ✓ |  |
| `↳ backSpritesEnabled` | boolean |  |  |
| `↳ frontSpritesEnabled` | boolean |  |  |
| `↳ iconSpritesEnabled` | boolean |  |  |
| `↳ mapImageLink` | string |  |  |
| `locations` | Location[] | ✓ | References: Location |
| `name` | string | ✓ |  |
| `pokedex` | object[] | ✓ |  |
| `↳ id` | ObjectId |  | References: DexEntry |
| `↳ name` | string |  |  |
| `progressionDefinitions` | Map | ✓ |  |
| `quests` | object | ✓ |  |
| `↳ active` | Quest[] | ✓ | References: Quest |
| `↳ passive` | Quest[] | ✓ | References: Quest |
| `↳ maxPassiveQuests` | number |  |  |
| `shops` | Shop[] | ✓ | References: Shop |
| `transportationTypes` | string[] | ✓ |  |

#### Map: `progressionDefinitions`

**Value Type:** `Schema`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `kind` | string | ✓ |  |
| `name` | string | ✓ |  |
| `description` | string |  |  |
| `visibility` | string |  |  |
| `min` | number |  |  |
| `max` | number |  |  |
| `sequential` | boolean |  |  |
| `milestones` | object[] |  |  |
| `↳ milestones.key` | string | ✓ |  |
| `↳ milestones.label` | string | ✓ |  |
| `↳ milestones.description` | string |  |  |
| `↳ milestones.imageUrl` | string |  |  |
| `↳ milestones.ordinal` | number |  |  |

## Relationships

| From | Field | To |
|------|-------|----|
| User | `servers` | Server |
| Server | `playerList` | User |
| Server | `regions` | Region |
| Region | `characterList` | Character |
| Region | `locations` | Location |
| Region | `pokedex_id` | DexEntry |
| Region | `quests_active` | Quest |
| Region | `quests_passive` | Quest |
| Region | `shops` | Shop |
