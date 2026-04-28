import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Stichting The V.O.I.C.E. NL API" });
});

app.use("/api", apiRoutes);

export default app;
