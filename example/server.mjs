import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import express from "express";
import morgan from "morgan";

const app = express();
const port = process.env.PORT || 5001;

app.use(morgan("combined"));
app.use(express.static("./"));

const server = app.listen(port, () => {
  console.log("Listening on port: ", port)
});

server.on("upgrade", (request, socket, head) => {
  wisp.routeRequest(request, socket, head);
});