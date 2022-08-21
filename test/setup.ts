import "dotenv/config";
import mongoose from "mongoose";

beforeAll(async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI || "");
    }
    catch (error) {
        console.log(error);
    }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
});
