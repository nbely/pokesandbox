import User from "../db/models/user.model";
import cors from "cors";
import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/profile/:id', async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        let data = await User.findById(id);
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
        
        return res.json({ data });
    }
    catch (e) {
        console.log('error', e);
        return res.json({ e });
    }
})

const port = process.env.EXPRESS_PORT || 3000;

app.listen(port, () => console.info(`server listening on port ${port}!`));
