import express, { Request, Response } from "express";

import Server from "../../db/models/server.model";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  // const id = req.params.id;
  try {
    const data = await Server.find({});

    console.log("Servers found", data);
    return res.json({ data });
  } catch (e) {
    console.log("error", e);
    return res.json({ e });
  }
});

export default router;
