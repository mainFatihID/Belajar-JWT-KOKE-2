import express, { type Express, type Request, type Response } from 'express';
import pool from './db/index.ts';
import jwt from 'jsonwebtoken'
import { authMiddleware } from './middlewares/authMiddleware.ts';
import { upload, cloudinary } from './middlewares/upploadMiddleware.ts'
import { resolve } from 'node:dns';
import { rejects } from 'node:assert';
import { error } from 'node:console';

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
      const identifier = req.body?.email || req.body?.username || req.body?.identifier;
      const password = req.body?.password;

      if (!identifier || !password) {
        return res.status(400).json({
          message: 'Login Failed! Email/Username and password are required.'
        })
      }
    
      // 2. get user by email (query)
      const [users] : any = await pool.execute(
        'SELECT * FROM users WHERE email = ? OR username = ?', 
        [identifier, identifier]
      )
    
      if (!users || users.length === 0) {
        return res.status(401).json({
          message : 'Email/Username or password incorrect.'
        })
      }

      const user = users[0];
    
      // 3. ngecompare password
      if (user.password != password) {
        return res.status(401).json({
          message : 'Password incorrect'
        })
      }
    
      // 4. generate jwt
      const token = jwt.sign(
        { id: user.id, email: users[0].email, username: users[0].username },
        process.env.JWT_SECRET || 'super-secret',
        { expiresIn: '1d'  }
      );
    
      // 5. kirim token
      return res.status(200).json({
        message : "Login Success!",
        token   : token
      });
      
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        message: 'Internal server error'
      })
    }
  }
)

app.post('/api/register', upload.single('profile_picture'), async (req: Request, res: Response) => {
  // 1. Bikin try catch.
  try {
    const {username, email, password} = req.body || {};
    let profilePictureUrl = null;

    // 2. Bikin validasi input.
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Username, email, and password are required!'
      });
    }

    // !!!!
    if (req.file) {
      
    }

    // 3. Pengecekan username atau email.
    const [existingUser]: any = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        message: 'Username or Email is already registered!'
      });
    }

    // 4. Import gambar dan insert akun ke database.
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {folder: 'user_profiles'},
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      }) as any;
      profilePictureUrl = uploadResult.source_url;
    }

    // 5. Save ke database
    const [result]: any = await pool.execute(
      'INSERT INTO users (username, email, password, profile_picture) VALUES (?, ?, ?, ?)',
      [username, email, password, profilePictureUrl]
    );

    return res.status(201).json({
      message : 'Register success!',
      data    : {
        id    : result.insertId,
        username,
        email,
        profilePictureUrl: profilePictureUrl
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

app.listen(port, () => {
    console.log(`App listen at ${port}, open it in ThuderClient use http://localhost:${port}`)
  }
);