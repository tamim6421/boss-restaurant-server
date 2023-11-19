const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

const usersCollection = client.db("bossDb").collection('users')
const menuCollection = client.db("bossDb").collection('menu')
const reviewCollection = client.db("bossDb").collection('reviews')
const cartCollection = client.db("bossDb").collection('carts')
const paymentCollection = client.db("bossDb").collection('payments')



// jwt related api 
app.post('/jwt', async(req, res) =>{
  const user = req.body 
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1hr'})
  res.send({token})
})


// users related api 

// middleware
const verifyToken = (req, res, next)=>{
  console.log('inside verify token', req.headers.authorization)
 
  if(!req.headers.authorization){
    return res.status(401).send({message: 'unauthorized access'})
  }
  const token = req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
 
}


//use verify admin after verify token 
const verifyAdmin = async(req, res, next) =>{
  const email = req.decoded.email 
  const query = {email: email}
  const user = await usersCollection.findOne(query)
  const isAdmin = user?.role === 'admin'
  if(!isAdmin){
    return res.status(403).send({message: 'forbidden access'})
  }
  next()
}

// get total users for admin 
app.get('/users', verifyToken,verifyAdmin, async(req, res) =>{
    // console.log(req.headers)
    const result = await usersCollection.find().toArray()
    res.send(result)
})

// delete users 
app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res) =>{
  try {
    const id = req.params.id 
  const query = {_id: new ObjectId(id)}
  const result = await usersCollection.deleteOne(query)
  res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

//check admin role get email 
app.get('/users/admin/:email', verifyToken, async(req, res) =>{
  const email = req.params.email 

  if(email !== req.decoded.email){
    return res.status(403).send({message:'forbidden access'})
  }
  const query = {email: email}
  const user = await usersCollection.findOne(query)
  let admin = false 
  if(user){
    admin = user?.role === 'admin'
  }
  res.send({admin})
})

// edit users roll 
app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res) =>{
  try {
    const id = req.params.id 
    const filter = {_id: new ObjectId(id)}
    const updatedDoc = {
      $set:{
        role: 'admin'
      }
    }
    const result = await usersCollection.updateOne( filter, updatedDoc)
    res.send(result)
    
  } catch (error) {
    console.log(error)
  }

})

// post users info 
app.post('/users', async(req, res) =>{
  const user = req.body 



  // insert email if user don not exists 
  // simple checking 
  const query = {email: user.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser){
    return res.send({message: 'user already exist', insertedId: null})
  }
  const result = await usersCollection.insertOne(user)
  res.send(result)
})


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

// post data to ta add data form 
app.post('/menu', verifyToken, verifyAdmin, async(req, res) =>{
  const item = req.body 
  // if (item._id) {
  //   delete item._id; // Remove the _id field if it's present
  // }
  const result = await menuCollection.insertOne(item)
  res.send(result)
})


// get a specific menu items
app.get('/menu/:id', async(req, res) =>{
  try {
  const id = req.params.id 
  const query = {_id: new ObjectId(id)}
  const result = await menuCollection.findOne(query)
  res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

// update menu items 
app.patch('/menu/:id', async(req, res) =>{
  const item = req.body 
  const id = req.params.id 
  const filter = {_id: new ObjectId(id)}
  const updatedDoc = {
    $set:{
      name: item.name,
      category: item.category,
      price: item.price,
      recipe: item.recipe,
      image: item.image
    }
  }
  const result = await menuCollection.updateOne(filter, updatedDoc)
  res.send(result)
} )

// delete menu items 
app.delete('/menu/:id',verifyToken, verifyAdmin, async(req, res) =>{
  try {
    const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await menuCollection.deleteOne(query)
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

// payment related api 
// payment intent 
app.post('/create-payment-intent', async(req, res) =>{
  const {price} = req.body 
  const amount = parseInt(price * 100)
  console.log(amount, ' amount in te intent')
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    
    currency: "usd",
    payment_method_types: [
      "card"
    ],
  })

  res.send({
    clientSecret: paymentIntent.client_secret,
  });

})


// payment history data 
app.post('/payments', async(req, res) =>{
  const payment = req.body 
  const paymentResult = await paymentCollection.insertOne(payment)


  // delete each items from the carts
 
  
  const query = {_id: {
    $in: payment.cartIds.map(id => new ObjectId(id))
  }}

  const deleteResult = await cartCollection.deleteMany(query)
  res.send({paymentResult, deleteResult})
  
})

// get payment information 
app.get('/payments/:email', verifyToken, async(req, res) =>{
  const query = {email: req.params.email}
  if(req.params.email !== req.decoded.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  const result = await paymentCollection.find(query).toArray()
  res.send(result)
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