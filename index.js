// index.js
const express = require('express');
const jwt = require('jsonwebtoken');

const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginLandingPageDisabled } = require('apollo-server-core');
const { typeDefs, resolvers } = require('./schema');


// Fake user data (replace with DB lookup)
const users = [
  { id: '1', username: 'alberto', password: 'password123' },
  { id: '2', username: 'bob', password: 'mypassword' },
];

function issueToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    // you can add more user data if you want
  };

  const secret = 'your_secret_key'; // use a strong secret & keep it safe (env var recommended)
  const options = {
    expiresIn: '10m', // token expires in 30 seconds
  };

  const token = jwt.sign(payload, secret, options);
  return token;
}

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length);

    try {
      const secret = 'your_secret_key';
      const user = jwt.verify(token, secret);
      req.user = user; // Attach user info to request
    } catch (err) {
      // Token invalid or expired
      console.error('JWT verification failed', err);
      return res.status(403).json(err);
    }
  }
  next();
};

async function startServer() {
  const app = express();

  app.post('/login', express.json(), (req, res) => {

    if (!req.body) return res.status(500).json({ "error": "No body provided" });
    // Dummy user for demonstration
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue a token
    const token = issueToken(user);
    res.json({ token });
  });
  

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      return { user: req.user };
    },
    introspection: false,
    plugins: [ApolloServerPluginLandingPageDisabled()],
  });

  await server.start();

  app.use(authenticateJWT); // Middleware to authenticate JWT
  
  app.use('/graphql', (req, res, next) => {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(403).json({ error: 'Not authenticated' });
    }
    next();
  });

  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
}

startServer();
