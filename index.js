const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000 

// middleware 
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.PROJECT_NAME}:${process.env.PROJECT_PASS}@cluster0.iimwc2a.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const menuCollection = client.db("bossDb").collection('menu')
const reviewCollection = client.db("bossDb").collection('reviews')
const cartCollection = client.db("bossDb").collection('carts')


// get all menus 
app.get('/menu', async(req, res) =>{
  try {
    const query = menuCollection.find()
    const result = await query.toArray()
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})


// get all review
app.get('/review', async(req, res) =>{
  try {
    const query = reviewCollection.find()
    const result = await query.toArray()
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})


// create cart collection 
app.post('/carts', async(req, res) =>{
  try {
    const cartItem = req.body 
    const result = await cartCollection.insertOne(cartItem)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})

// get all cart collection 
app.get('/carts', async(req, res) =>{
  try {
    const email = req.query.email 
    const query = {email: email}
    console.log(email)
    const result = await cartCollection.find(query).toArray()
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})

// delete cart 
app.delete('/carts/:id', async(req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const result = await cartCollection.deleteOne(query)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();





    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('Boss Is Running')
})

app.listen(port, () =>{
    console.log(`Boss Restaurant is Open Port ${port}`)
})