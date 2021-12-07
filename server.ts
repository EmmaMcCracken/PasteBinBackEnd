import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

// GET 10 most recent pastes
app.get("/", async (req, res) => {
  const dbres = await client.query(
    "SELECT * FROM pastes ORDER BY date DESC LIMIT 10"
  );
  res.json(dbres.rows);
});

// GET specific paste by id
app.get("/:n", async (req, res) => {
  const n = req.params.n;
  const dbres = await client.query("SELECT * FROM pastes WHERE id = $1", [n]);
  const result = dbres.rows;
  if (result.length === 1) {
    res.status(200).json({
      status: "success",
      data: result,
    });
  } else {
    res.status(404).json({
      status: "failed: id does not exist",
    });
  }
});

// GET n most recent pastes
app.get("/pastes/:n", async (req, res) => {
  const n = req.params.n;
  const dbres = await client.query(
    "SELECT * FROM pastes ORDER BY date DESC LIMIT $1",
    [n]
  );
  res.json(dbres.rows);
});

app.post("/", async (req, res) => {
  const { title, text } = req.body;

  if (
    typeof text === "string" &&
    ((typeof title === "string" && title.length < 51) || title === undefined) &&
    text !== ""
  ) {
    const dbres = await client.query(
      "INSERT INTO pastes (title, text) VALUES ($1, $2) returning *",
      [title, text]
    );
    res.status(200).json({
      status: "success",
      data: dbres.rows,
    });
  } else {
    res.status(404).json({
      status:
        "failed: text expects a non-empty string, (optional) title should not exceed 50 characters",
      data: req.body,
    });
  }
});

// DELETE specific paste by id
app.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const dbres = await client.query(
    "DELETE FROM pastes WHERE id = $1 returning *",
    [id]
  );
  const result = dbres.rows;
  if (result.length === 1) {
    res.status(200).json({
      status: "success",
      data: result,
    });
  } else {
    res.status(404).json({
      status: "failed: id does not exist",
      data: id,
    });
  }
});

// Update specific paste by id
app.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, text } = req.body;
  let result = [];
  if (
    typeof title === "string" &&
    title.length < 51 &&
    typeof text === "string"
  ) {
    const dbres = await client.query(
      "UPDATE pastes SET title = $1, text = $2 WHERE id = $3 returning *",
      [title, text, id]
    );
    result = dbres.rows;
  } else if (title === undefined && typeof text === "string") {
    const dbres = await client.query(
      "UPDATE pastes SET text = $1 WHERE id = $2 returning *",
      [text, id]
    );
    result = dbres.rows;
  } else if (
    text === undefined &&
    typeof title === "string" &&
    title.length < 51
  ) {
    const dbres = await client.query(
      "UPDATE pastes SET title = $1 WHERE id = $2 returning *",
      [title, id]
    );
    result = dbres.rows;
  }
  if (result.length === 1) {
    res.status(200).json({
      status: "success",
      data: result,
    });
  } else {
    res.status(404).json({
      status:
        "failed: id does not exist, title should not exceed 50 characters, body should contain atleast a title or text",
      data: id,
    });
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
