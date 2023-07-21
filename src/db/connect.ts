import { connect } from "mongoose";

run().catch((err) => console.log(err));

async function run() {
  await connect(process.env.DATABASE_URI || "");
  console.info("Connected to MongoDB with Mongoose");
}
