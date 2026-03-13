const db = require('./db')
const jwt = require('jsonwebtoken')

// Hardcoded secret - bad practice
const JWT_SECRET = 'mysecret123'

async function login(username, password) {
  // SQL injection vulnerability
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  const user = await db.query(query)
  
  if (user) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET)
    return token
  }
  return null
}

async function getUser(userId) {
  // No authorization check
  const query = `SELECT * FROM users WHERE id = ${userId}`
  return await db.query(query)
}

module.exports = { login, getUser }