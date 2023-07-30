import cors from "cors";
import express from "express";

// Routes
import regionsRoute from "./routes/regions";
import serversRoute from "./routes/servers";
import usersRoute from "./routes/users";

const port = process.env.EXPRESS_PORT || 3000;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Middleware Routes
app.use("/regions", regionsRoute)
app.use("/servers", serversRoute);
app.use("/users", usersRoute);

app.listen(port, () =>
  console.info(`Express server is listening on port ${port}`),
);
