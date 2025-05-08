import express from "express";
import dotenv from "dotenv";
// import { DB_NAME } from "./constants.js";
import ConnectDb from "./db/index.js";
dotenv.config({ path: "./.env" });
import app from "./app.js";

// const app = express();

// (async () => {
//   try {
//     const dbinstant = await mongoose.connect(
//       `${process.env.MONGO_URI}/${DB_NAME}`
//     );
//     console.log(`DB Connected at ${dbinstant.connection.host}`);
//     // console.log(process.env);
//     console.log(dbinstant);

//     app.on("error", (error) => {
//       console.log("app/server is not running properly", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`Server is running on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("DB Connection Failed", error);
//     throw error;
//   }
// })();

ConnectDb()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("DB Connection Failed", error);
  });
