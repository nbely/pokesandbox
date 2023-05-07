import cors from 'cors';
import express from 'express';

// Routes
import userRoute from './routes/user';

const port = process.env.EXPRESS_PORT || 3000;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Middleware Routes
app.use('/user', userRoute);

app.listen(port, () => console.info(`Express server is listening on port ${port}`));
