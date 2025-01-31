import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    set: () => new Date(), // Ensure createdAt is not assignable when creating a new thought
  },
});

const port = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

// Display available routes
app.get("/", (req, res) => {
  res.json(listEndpoints(app));
});

// GET /thoughts
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find().sort({ createdAt: "desc" }).limit(20);
    res.status(200).json(thoughts);
  } catch (error) {
    console.error("Error fetching thoughts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /thoughts
app.post("/thoughts", async (req, res) => {
  const { message } = req.body;

  try {
    const newThought = new Thought({ message });
    const savedThought = await newThought.save();
    res.status(201).json(savedThought);
  } catch (error) {
    if (error.name === "ValidationError") {
      // Handle validation errors
      res.status(400).json({ error: "Invalid input", validationErrors: error.errors });
    } else {
      console.error("Error saving thought:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

// GET /thoughts/:id
app.get("/thoughts/:id", async (req, res) => {
  const thoughtId = req.params.id;
  const foundThought = await Thought.findById(thoughtId);
  if (foundThought) {
    res.status(200).json(foundThought);
  } else {
    res.status(404).json({ error: `No thought matching that id found` });
  }
});

// POST /thoughts/:id/like
app.post("/thoughts/:id/like", async (req, res) => {
  const { id } = req.params;

  try {
    const thought = await Thought.findByIdAndUpdate(
      id,
      { $inc: { hearts: 1 } },
      { new: true }
    );

    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }

    res.status(200).json(thought);
  } catch (error) {
    console.error("Error adding like:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
