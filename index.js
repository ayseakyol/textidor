"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const config = require("./config");

// - setup -
const FILES_DIR = __dirname + "/text-files";
// create the express app
const app = express();

// - use middleware -
// allow Cross Origin Resource Sharing
app.use(cors());
// parse the body
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "text/plain" }));

// https://github.com/expressjs/morgan#write-logs-to-a-file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));
// and log to the console
app.use(morgan("dev"));

// statically serve the frontend
app.use("/", express.static(path.join(__dirname, "public")));

// - declare routes -

// read all file names
app.get("/files/", (req, res, next) => {
  fs.readdir(FILES_DIR, (err, list) => {
    if (!list) {
      res.status(404).end();
      return;
    }
    if (err) {
      // https://expressjs.com/en/guide/error-handling.html
      next(err);
      return;
    }

    res.json(list);
  });
});

// read a file
app.get("/files/:name", (req, res, next) => {
  const fileName = req.params.name;
  fs.readFile(`${FILES_DIR}/${fileName}`, "utf-8", (err, fileText) => {
    if (!fileText) {
      res.status(404).end();
      return;
    }
    if (err) {
      next(err);
      return;
    }

    const responseData = {
      name: fileName,
      text: fileText,
    };
    res.json(responseData);
  });
});

// write a file
app.post("/files/:name", (req, res, next) => {
  const fileName = req.params.name;
  const fileText = req.body.text;
  fs.writeFile(`${FILES_DIR}/${fileName}`, fileText, (err) => {
    if (err) {
      next(err);
      return;
    }

    // https://stackoverflow.com/questions/33214717/why-post-redirects-to-get-and-put-redirects-to-put
    res.redirect(303, "/files");
  });
});

// delete a file
app.delete("/files/:name", (req, res, next) => {
  const fileName = req.params.name;
  fs.unlink(`${FILES_DIR}/${fileName}`, (err) => {
    if (err && err.code === "ENOENT") {
      res.status(403);
      return;
    }
    if (err) {
      next(err);
      return;
    }

    res.redirect(303, "/files");
  });
});

// - handle errors in the routes and middleware -

// https://expressjs.com/en/guide/error-handling.html
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).end();
});

// - open server -
// try to exactly match the message logged by demo.min.js
app.listen(config.PORT, () => {
  console.log(
    `Example app listening at http://localhost:${config.PORT} (${config.MODE} mode)`
  );
});
