// schema.js
const { gql } = require('apollo-server-express');

const books = [
  { id: '1', title: 'The Hobbit', author: 'J.R.R. Tolkien' },
  { id: '2', title: '1984', author: 'George Orwell' },
];

const typeDefs = gql`
  type Book {
    id: ID!
    title: String
    author: String
  }

  type Query {
    books(query: String): [Book]
    book(id: ID!): Book
  }
`;

const resolvers = {
  Query: {
    books: (_, { query }) => {
      if (!query) return books;
      const lower = query.toLowerCase();
      return books.filter(book =>
        book.title.toLowerCase().includes(lower) ||
        book.author.toLowerCase().includes(lower)
      );
    },
    book: (_, { id }, context) => books.find(book => book.id === id)
  },
};

module.exports = { typeDefs, resolvers };
