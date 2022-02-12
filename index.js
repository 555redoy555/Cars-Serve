const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const cors = require('cors');
require('dotenv').config();
const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());

async function verifyToken(req, res, next) {
     if (req.headers?.authorization?.startsWith('Bearer ')) {
          const token = req.headers.authorization.split(' ')[1];

          try {
               const decodedUser = await admin.auth().verifyIdToken(token);
               req.decodedEmail = decodedUser.email;
          }
          catch {

          }

     }
     next();
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.to6vq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });





async function run() {
     try {
          await client.connect();
          const database = client.db("Cars");
          const CarsCllection = database.collection("Cars");
          const orderCollection = database.collection("order")
          const UserCollection = database.collection("users")
          const ReviewCollection = database.collection("Review")


          // GET API 

          app.get('/Cars', async (req, res) => {
               const cursor = CarsCllection.find({});
               const order = await cursor.toArray();
               res.send(order);

          });

          app.get('/order', async (req, res) => {
               const cursor = orderCollection.find({});
               const order = await cursor.toArray();
               res.send(order);

          })
          app.get('/users', async (req, res) => {
               const cursor = UserCollection.find({});
               const order = await cursor.toArray();
               res.send(order);

          })
          app.get('/Review', async (req, res) => {
               const cursor = ReviewCollection.find({});
               const order = await cursor.toArray();
               res.send(order);

          })

          // GET Single Service   no


          app.get("/Cars/:id", (req, res) => {
               console.log(req.params.id);
               CarsCllection
                    .find({ _id: ObjectId(req.params.id) })
                    .toArray((err, results) => {
                         res.send(results[0]);
                    });
          });
          app.get("/order/:id", (req, res) => {
               console.log(req.params.id);
               orderCollection
                    .find({ _id: ObjectId(req.params.id) })
                    .toArray((err, results) => {
                         res.send(results[0]);
                    });
          });


          // get all order by email query


          app.get("/myOrders/:email", (req, res) => {
               console.log(req.params);
               orderCollection
                    .find({ email: req.params.email })
                    .toArray((err, results) => {
                         res.send(results);
                    });
          });


          app.get('/users/:email', async (req, res) => {
               const email = req.params.email;
               const query = { email: email };
               const user = await UserCollection.findOne(query);
               let isAdmin = false;
               if (user?.role === 'admin') {
                    isAdmin = true;
               }
               res.json({ admin: isAdmin });
          })



          // DELETE 


          app.delete("/order/:id", async (req, res) => {
               console.log(req.params.id);

               orderCollection
                    .deleteOne({ _id: ObjectId(req.params.id) })
                    .then((result) => {
                         res.send(result);
                    });
          });
          app.delete("/Cars/:id", async (req, res) => {
               console.log(req.params.id);

               CarsCllection
                    .deleteOne({ _id: ObjectId(req.params.id) })
                    .then((result) => {
                         res.send(result);
                    });
          });


          // POST API 
          app.post('/Cars', async (req, res) => {
               const car = req.body;
               console.log('hit the post api', car);

               const result = await CarsCllection.insertOne(car);
               console.log(result);
               res.json(result)
          });
          app.post('/order', async (req, res) => {
               const order = req.body;
               console.log('hit the post api', order);

               const result = await orderCollection.insertOne(order);
               console.log(result);
               res.json(result)
          });
          app.post('/users', async (req, res) => {
               const user = req.body;
               console.log('hit the post api', user);

               const result = await UserCollection.insertOne(user);
               console.log(result);
               res.json(result)
          });
          app.post('/Review', async (req, res) => {
               const Review = req.body;
               console.log('hit the post api', Review);

               const result = await ReviewCollection.insertOne(Review);
               console.log(result);
               res.json(result)
          });



          app.put('/users', async (req, res) => {
               const user = req.body;
               const filter = { email: user.email };
               const options = { upsert: true };
               const updateDoc = { $set: user };
               const result = await UserCollection.updateOne(filter, updateDoc, options);
               res.json(result);
          });


          //make a admin
          app.put('/users/admin', verifyToken, async (req, res) => {
               const user = req.body;
               const requester = req.decodedEmail;
               if (requester) {
                    const requesterAccount = await UserCollection.findOne({ email: requester });
                    if (requesterAccount.role === 'admin') {
                         const filter = { email: user.email };
                         const updateDoc = { $set: { role: 'admin' } };
                         const result = await UserCollection.updateOne(filter, updateDoc);
                         res.json(result);
                         console.log(result)
                    }
               }
               else {
                    res.status(403).json({ message: 'you do not have access to make admin' })
               }

          })



     }
     finally {
          // await client.close();
     }
}
run().catch(console.dir);



app.get("/", (req, res) => {
     res.send("hi there")
})


app.listen(port, () => {
     console.log("I am in port", port)
})