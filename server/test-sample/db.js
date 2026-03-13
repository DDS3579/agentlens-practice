const mysql = require('mysql')

// Credentials hardcoded
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin123',
  database: 'myapp'
})

async function query(sql) {
  // No error handling
  return new Promise((resolve) => {
    connection.query(sql, (err, results) => {
      resolve(results)
    })
  })
}

module.exports = { query }
