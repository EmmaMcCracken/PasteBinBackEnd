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
app.get("/pastes", async (req, res) => {
  const dbres = await client.query(
    "SELECT * FROM pastes ORDER BY date DESC LIMIT 10"
  );
  res.json(dbres.rows);
});

// GET specific paste by id
app.get("/pastes/:n", async (req, res) => {
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
app.get("/pastes/limit/:n", async (req, res) => {
  const n = req.params.n;
  const dbres = await client.query(
    "SELECT * FROM pastes ORDER BY date DESC LIMIT $1",
    [n]
  );
  res.json(dbres.rows);
});

app.post("/pastes", async (req, res) => {
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
app.delete("/pastes/:id", async (req, res) => {
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
app.put("/pastes/:paste_id", async (req, res) => {
  const paste_id = parseInt(req.params.paste_id);
  const { title, text } = req.body;
  let result = [];
  if (
    typeof title === "string" &&
    title.length < 51 &&
    typeof text === "string"
  ) {
    const dbres = await client.query(
      "UPDATE pastes SET title = $1, text = $2 WHERE id = $3 returning *",
      [title, text, paste_id]
    );
    result = dbres.rows;
  } else if (title === undefined && typeof text === "string" && text !== "") {
    const dbres = await client.query(
      "UPDATE pastes SET text = $1 WHERE id = $2 returning *",
      [text, paste_id]
    );
    result = dbres.rows;
  } else if (
    text === undefined &&
    typeof title === "string" &&
    title.length < 51
  ) {
    const dbres = await client.query(
      "UPDATE pastes SET title = $1 WHERE id = $2 returning *",
      [title, paste_id]
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
        "failed: paste_id does not exist, title should not exceed 50 characters, body should contain atleast a non-emptytitle or text",
      data: { title: title, text: text, paste_id: paste_id },
    });
  }
});

// GET all comments
app.get("/comments", async (req, res) => {
  const dbres = await client.query("SELECT * FROM comments ORDER BY date DESC");
  res.json(dbres.rows);
});

// GET specific comment by comment_id
app.get("/comments/:comment_id", async (req, res) => {
  const comment_id = req.params.comment_id;
  const dbres = await client.query(
    "SELECT * FROM comments WHERE comment_id = $1",
    [comment_id]
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
    });
  }
});

// GET n most recent comments
app.get("/comments/limit/:n", async (req, res) => {
  const n = req.params.n;
  const dbres = await client.query(
    "SELECT * FROM comments ORDER BY date DESC LIMIT $1",
    [n]
  );
  res.json(dbres.rows);
});

//GET comments on paste with id n
app.get("/paste/:id/comments", async (req, res) => {
  const id = req.params.id;
  try {
    const dbres = await client.query(
      "SELECT * FROM comments WHERE paste_id = $1 ORDER BY date DESC LIMIT 10 ",
      [id]
    );
    const result = dbres.rows;

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch {
    res.status(404).json({
      status: "failed: id does not exist",
    });
  }
});

app.post("/comments/:paste_id", async (req, res) => {
  const { text } = req.body;
  const paste_id = parseInt(req.params.paste_id);
  if (typeof text === "string" && text !== "") {
    try {
      const dbres = await client.query(
        "INSERT INTO comments (paste_id, text) VALUES ($1, $2) returning *",
        [paste_id, text]
      );

      res.status(200).json({
        status: "success",
        data: dbres.rows,
      });
    } catch {
      res.status(404).json({
        status: "failed: paste_id does not exist",
        data: req.body,
      });
    }
  } else {
    res.status(404).json({
      status: "failed: text expects a non-empty string",
      data: req.body,
    });
  }
});

// DELETE specific paste by id
app.delete("/comments/:paste_id", async (req, res) => {
  const id = parseInt(req.params.paste_id);
  const dbres = await client.query(
    "DELETE FROM comments WHERE comment_id = $1 returning *",
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
      status: "failed: comment_id does not exist",
      data: id,
    });
  }
});

// Update specific comment by id
app.put("/comments/:comment_id", async (req, res) => {
  const id = parseInt(req.params.comment_id);
  const { text } = req.body;
  let result = [];
  if (typeof text === "string" && text !== "") {
    try {
      const dbres = await client.query(
        "UPDATE comments SET  text = $1 WHERE comment_id = $2 returning *",
        [text, id]
      );
      result = dbres.rows;
      if (dbres.rows.length === 1) {
        res.status(200).json({
          status: "success",
          data: result,
        });
      } else {
        res.status(404).json({
          status: "failed: id does not exist",
          data: { id: id, text: text },
        });
      }
    } catch (err) {
      res.status(404).json({
        status: "failed",
        data: { id: id, text: text },
        error: err,
      });
    }
  } else {
    res.status(404).json({
      status: "failed: Body should contain a non-empty string for text",
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
