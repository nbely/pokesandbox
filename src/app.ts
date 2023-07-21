import "module-alias/register";
import "dotenv/config";

//connect to the MongoDB database
import "./db/connect";

//run the discord bot
import "./bot/index";

//run the express server
import "./server/index";
