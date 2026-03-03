# Entity Relationship Diagram

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

    Location {
        string name
        ObjectId regionId
        object requirements
        Map requirements_progressions
        Mixed requirements_progressions.$*
        object[] requirements_items
        ObjectId requirements_items_itemId
        number requirements_items_minQuantity
        object[] requirements_capabilities
        string requirements_capabilities_type
        string requirements_capabilities_move
        number requirements_capabilities_min
        object[] connections
        ObjectId connections_toLocationId
        object connections_requirements
        Map connections_requirements_progressions
        Mixed connections_requirements_progressions.$*
        object[] connections_requirements_items
        ObjectId connections_requirements_items_itemId
        number connections_requirements_items_minQuantity
        object[] connections_requirements_capabilities
        string connections_requirements_capabilities_type
        string connections_requirements_capabilities_move
        number connections_requirements_capabilities_min
        Trainer[] trainerIds
        object[] wildTables
        string wildTables_encounterType
        object[] wildTables_timeBlocks
        string wildTables_timeBlocks_timeOfDay
        object[] wildTables_timeBlocks_slots
        ObjectId wildTables_timeBlocks_slots_speciesId
        number wildTables_timeBlocks_slots_minLevel
        number wildTables_timeBlocks_slots_maxLevel
        number wildTables_timeBlocks_slots_weight
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
    Location ||--o{ Region : "regionId"
    Location ||--o{ Item : "requirements_items_itemId"
    Location ||--o{ Location : "connections_toLocationId"
    Location ||--o{ Item : "connections_requirements_items_itemId"
    Location ||--o{ Trainer : "trainerIds"
    Location ||--o{ DexEntry : "wildTables_timeBlocks_slots_speciesId"
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

### Location

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✓ |  |
| `regionId` | ObjectId | ✓ | References: Region |
| `requirements` | object |  |  |
| `↳ progressions` | Map |  |  |
| `↳ progressions.$*` | Mixed |  |  |
| `↳ items` | object[] |  |  |
| `↳ ↳ itemId` | ObjectId | ✓ | References: Item |
| `↳ ↳ minQuantity` | number |  |  |
| `↳ capabilities` | object[] |  |  |
| `↳ ↳ type` | string | ✓ |  |
| `↳ ↳ move` | string |  |  |
| `↳ ↳ min` | number |  |  |
| `connections` | object[] | ✓ |  |
| `↳ toLocationId` | ObjectId | ✓ | References: Location |
| `↳ requirements` | object |  |  |
| `↳ ↳ progressions` | Map |  |  |
| `↳ ↳ progressions.$*` | Mixed |  |  |
| `↳ ↳ items` | object[] |  |  |
| `↳ ↳ ↳ itemId` | ObjectId | ✓ | References: Item |
| `↳ ↳ ↳ minQuantity` | number |  |  |
| `↳ ↳ capabilities` | object[] |  |  |
| `↳ ↳ ↳ type` | string | ✓ |  |
| `↳ ↳ ↳ move` | string |  |  |
| `↳ ↳ ↳ min` | number |  |  |
| `trainerIds` | Trainer[] |  | References: Trainer |
| `wildTables` | object[] |  |  |
| `↳ encounterType` | string | ✓ |  |
| `↳ timeBlocks` | object[] | ✓ |  |
| `↳ ↳ timeOfDay` | string | ✓ |  |
| `↳ ↳ slots` | object[] | ✓ |  |
| `↳ ↳ ↳ speciesId` | ObjectId | ✓ | References: DexEntry |
| `↳ ↳ ↳ minLevel` | number | ✓ |  |
| `↳ ↳ ↳ maxLevel` | number | ✓ |  |
| `↳ ↳ ↳ weight` | number | ✓ |  |

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
| Location | `regionId` | Region |
| Location | `requirements_items_itemId` | Item |
| Location | `connections_toLocationId` | Location |
| Location | `connections_requirements_items_itemId` | Item |
| Location | `trainerIds` | Trainer |
| Location | `wildTables_timeBlocks_slots_speciesId` | DexEntry |
