const express = require("express");
const router = require("./router");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const { initOpenAi } = require("./openai");

dotenv.config();

// by default runs on port 3001
const port = process.env.PORT || 3001;

// Creating express server
const app = express();
// for parsing application/json
app.use(express.json());
// use session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// initialise openai
initOpenAi();

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.use("/", router);
app.listen(port, () => {
  console.log("Server is running on port: " + port);
});
