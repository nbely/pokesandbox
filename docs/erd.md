# Entity Relationship Diagram

**Generated:** 2026-02-27T01:33:42.708Z

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
        ObjectId[] adminRoleIds
        object discovery
        ObjectId[] modRoleIds
        string name
        User[] playerList
        ObjectId[] prefixes
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
        Location[] locations
        string name
        ObjectId[] pokedex
        Map progressionDefinitions
        object quests
        Shop[] shops
        ObjectId[] transportationTypes
    }

    User ||--o{ Server : "references"
    Server ||--o{ Region : "references"
    Region ||--o{ Character : "references"
    Region ||--o{ Location : "references"
    Region ||--o{ Shop : "references"
```

## Entities

### User

| Field        | Type     | Required | Notes              |
| ------------ | -------- | -------- | ------------------ |
| `avatarUrl`  | string   |          |                    |
| `globalName` | string   | ✓        |                    |
| `servers`    | Server[] | ✓        | References: Server |
| `userId`     | string   | ✓        |                    |
| `username`   | string   | ✓        |                    |

### Server

| Field          | Type       | Required | Notes              |
| -------------- | ---------- | -------- | ------------------ |
| `serverId`     | string     | ✓        |                    |
| `adminRoleIds` | ObjectId[] | ✓        |                    |
| `discovery`    | object     | ✓        |                    |
| `modRoleIds`   | ObjectId[] | ✓        |                    |
| `name`         | string     | ✓        |                    |
| `playerList`   | User[]     | ✓        | References: User   |
| `prefixes`     | ObjectId[] | ✓        |                    |
| `regions`      | Region[]   | ✓        | References: Region |

### Region

| Field                    | Type        | Required | Notes                 |
| ------------------------ | ----------- | -------- | --------------------- |
| `baseGeneration`         | number      | ✓        |                       |
| `charactersPerPlayer`    | number      | ✓        |                       |
| `characterList`          | Character[] |          | References: Character |
| `currencyType`           | string      | ✓        |                       |
| `deployable`             | boolean     | ✓        |                       |
| `deployed`               | boolean     | ✓        |                       |
| `graphicSettings`        | object      | ✓        |                       |
| `locations`              | Location[]  | ✓        | References: Location  |
| `name`                   | string      | ✓        |                       |
| `pokedex`                | ObjectId[]  | ✓        |                       |
| `progressionDefinitions` | Map         | ✓        |                       |
| `quests`                 | object      | ✓        |                       |
| `shops`                  | Shop[]      | ✓        | References: Shop      |
| `transportationTypes`    | ObjectId[]  | ✓        |                       |

## Relationships

| From   | To        |
| ------ | --------- |
| User   | Server    |
| Server | User      |
| Server | Region    |
| Region | Character |
| Region | Location  |
| Region | Shop      |
