import express, { Request, Response } from "express";

import Region from "../../db/models/region.model";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const data = await Region.find({});

    console.log("Regions found", data);
    return res.json({ data });
  } catch (e) {
    console.log("error", e);
    return res.json({ e });
  }
});

export default router;
