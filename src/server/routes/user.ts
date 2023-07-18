import express, { Request, Response } from "express";

import User from "../../db/models/user.model";

const router = express.Router();

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const data = await User.findOne({ userId: id });
    // let data = await User.findById(id)
    //     .populate('party');
    // data = await User.populate(data, {
    //     path: 'boxes',
    // });
    // data = await User.populate(data, {
    //     path: 'party.originalTrainer',
    //     select: 'firstName lastName username',
    //     model: User,
    // });

    console.log("User found", data);
    return res.json({ data });
  } catch (e) {
    console.log("error", e);
    return res.json({ e });
  }
});

export default router;
