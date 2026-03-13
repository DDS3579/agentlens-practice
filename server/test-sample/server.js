const express = require('express')
const { login, getUser } = require('./auth')
const app = express()

app.use(express.json())

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const token = await login(username, password)
  if (token) {
    res.json({ token })
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

// Get user endpoint  
app.get('/api/users/:id', async (req, res) => {
  const user = await getUser(req.params.id)
  res.json(user)
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})