const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;

require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

//database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hoxgz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("Hoodies-Shop");
    const HoodiesCollection = database.collection("Hoodies");
    const orderedItems = database.collection("OrderedItems");
    const reviewsCollection = database.collection("Reviews");
    const usersCollection = database.collection("Users");

    app.get("/hoodies", async (req, res) => {
      const result = await HoodiesCollection.find({}).toArray();
      res.send(result);
    });
    app.get("/hoodies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await HoodiesCollection.findOne(query);
      res.send(result);
    });
    app.post("/hoodies", async (req, res) => {
      const doc = req.body;
      const result = await HoodiesCollection.insertOne(doc);
      res.json(result);
    });
    app.post("/orderedItems", async (req, res) => {
      const item = req.body;
      const filter = { _id: item._id };
      const options = { upsert: true };

      const allItems = await orderedItems.find({}).toArray();
      const alReadyHave = allItems.find((pro) => pro._id === item._id);
      let newItem = {};
      if (alReadyHave) {
        alReadyHave["quantity"] += item.quantity ? item.quantity : 1;
        newItem = alReadyHave;
      } else {
        item["quantity"] = 1;
        item.status = "pending";
        newItem = item;
      }
      const updateDoc = {
        $set: newItem,
      };
      const result = await orderedItems.updateOne(filter, updateDoc, options);
      res.json(result);
    });
    app.get("/orderedItems/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const result = await orderedItems.find(query).toArray();
      res.send(result);
    });
    app.delete("/orderedItems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await orderedItems.deleteOne(query);
      res.json(result);
    });
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find({}).toArray();
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const doc = req.body;
      const result = await reviewsCollection.insertOne(doc);

      res.json(result);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);
      let isAdmin;
      if (user?.role === "admin") {
        isAdmin = true;
      } else {
        isAdmin = false;
      }
      res.json({ isAdmin: isAdmin });
    });
    app.post("/users", async (req, res) => {
      const doc = req.body;
      const result = await usersCollection.insertOne(doc);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hoodies server is running");
});

app.listen(port, () => {
  console.log("server is running ", port);
});
