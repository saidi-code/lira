import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhook from "./controllers/webhooks.js";
import appRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();
const port = process.env.PORT || 3000;
// Connect to MongoDB
await connectDB();   
app.post('/api/v1/clerk', express.raw({ type: 'application/json' }),clerkWebhook) 
// Middleware
app.use(cors())
app.use(express.json());
app.use(clerkMiddleware());
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <html>
      <head><title>Server Status</title></head>
      <body style="font-family: Arial; text-align:center; margin-top:50px;">
        <h1>🚀 Server is Live! 🎉</h1>
        <p>Current time: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `);
});

app.use("/api/v1", appRoutes)

// Order matters: `notFoundHandler` only runs if no route matched, and
// `errorHandler` only if something reached `next(err)`. Both come after the
// routes, with the 404 before the error handler so an unmatched path becomes a
// clean JSON 404 instead of falling through.
//
// Express identifies an error middleware by arity, so `errorHandler` must keep
// all four parameters — see the note in that file.
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});