import 'reflect-metadata'
import CardResolver from './resolver'
import { ApolloServer } from 'apollo-server'
import { buildSchemaSync } from 'type-graphql'

const server = new ApolloServer({
  schema: buildSchemaSync({
    resolvers: [
      CardResolver
    ]
  })
})

const serverConfig = { port: 4000, cors: { origin: '*' } }
server.listen(serverConfig).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
