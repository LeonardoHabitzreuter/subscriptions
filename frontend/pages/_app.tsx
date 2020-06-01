import NextHead from 'next/head'

import ApolloClient from 'apollo-client'
import WebSocket from 'isomorphic-ws'
import fetch from 'isomorphic-fetch'
import { split } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import { getDataFromTree } from '@apollo/react-ssr'
import { getMainDefinition } from 'apollo-utilities'
import { ApolloProvider } from '@apollo/react-common'
import { InMemoryCache } from 'apollo-cache-inmemory'

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  fetch
})

const wsLink = new WebSocketLink({
  uri: 'ws://localhost:4000/graphql',
  options: {
    reconnect: true
  },
  webSocketImpl: WebSocket
})

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

const apollo = new ApolloClient({
  link,
  cache: new InMemoryCache()
})

const App = ({ Component, ...pageProps }: { Component: React.ComponentType }) => (
  <ApolloProvider client={apollo}>
    <Component {...pageProps} />
  </ApolloProvider>
)

App.getInitialProps = async ({ Component, ctx }: any) => {
  let pageProps = {} as any
  const apolloState = { data: {} }
  const { AppTree } = ctx

  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx)
  }

  if (typeof window === 'undefined') {
    if (ctx.res && (ctx.res.headersSent || ctx.res.finished)) {
      return pageProps
    }

    try {
      const props = { ...pageProps, apolloState, apollo }
      const appTreeProps =
        'Component' in ctx ? props : { pageProps: props }
      await getDataFromTree(<AppTree {...appTreeProps} />)
    } catch (error) {
      console.error(
        'GraphQL error occurred [getDataFromTree]',
        error
      )
    }

    NextHead.rewind()

    apolloState.data = (apollo.cache.extract() as object)
  }

  return { pageProps }
}

export default App
