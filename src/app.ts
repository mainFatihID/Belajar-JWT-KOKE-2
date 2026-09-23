import express, { type Express, type Request, type Response } from 'express';
import { connect } from 'node:http2';
import pool from './db/index.ts';
import jwt from 'jsonwebtoken'
import { authMiddleware } from './middlewares/authMiddleware.ts';

const app: Express = express();
const port = 3000;

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.get('/api/users', authMiddleware, async (req: Request, res: Response) => {
  // 1. Fetch data user dari tabel users di ThunderClient.
  try {
      const [users] = await pool.execute('SELECT id, username, email FROM users')

      return res.status(200).json({
        message : 'Successfully fetched users',
        data    : users
      })
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        message : 'Failed to fetch users',
        error   : error.message
      })
    } else {
      res.status(500).json({
        message : 'An expected error occured'
      })
    }
  }
})

app.post('/api/login', async (req: Request, res: Response) => {
    try {
      // 1. ngevalidasi data email sama password
      if (!req.body?.email || !req.body?.password) {
        return res.status(400).json({
          message: 'Login Failed!'
        })
      }
    
      // 2. get user by email (query)
      const [users] : any = await pool.execute(
        'SELECT * FROM users WHERE email = ?', 
        [req.body.email]
      )
    
      if (!users || users.length === 0) {
        return res.status(401).json({
          message : 'Email or password inccorect'
        })
      }
    
      // 3. ngecompare password
      if (users[0].password != req.body.password) {
        return res.status(400).json({
          message : 'Login Failed!'
        })
      }
    
      // 4. generate jwt
      const token = jwt.sign(
        { id: users.id, email: users.email  },
        'super-secret',
        { expiresIn: '1d'  }
      );
    
      // 5. kirim token
      return res.status(200).json({
        message : "Login Success!",
        token   : token
      }) 
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        message: 'Internal server error'
      })
    }
  }
)

app.listen(port, () => {
    console.log(`App listen at ${port}, open it in ThuderClient use http://localhost:${port}`)
  }
);