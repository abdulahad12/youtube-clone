import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const ConnectDb = async () => {
  try {
    const dbinstant = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );

    console.log(`DB Connected at ${dbinstant.connection.host}`);

    // console.log(dbinstant);
    // console.log(process);

    process.on("error", (error) => {
      console.log("app/server is not running properly", error);
      throw error;
    });
  } catch (error) {
    console.log("DB Connection Failed", error);
    process.exit(1);
  }
};

export default ConnectDb;
