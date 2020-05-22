import EventEmitter from 'events'
import { Field, ObjectType, Query, Resolver, Mutation, Arg, InputType, Subscription, Publisher, PubSub, Root } from 'type-graphql'

const myEmitter = new EventEmitter();

type Status = 'approved' | 'rejected'

@ObjectType()
class Card {
  @Field()
  cpf: string

  @Field()
  status: string
}

@InputType()
class CreateCardInput {
  @Field()
  cpf: string
}

let currentStatus = 'approved'
const worker = () => {
  currentStatus = currentStatus === 'approved' ? 'rejected' : 'approved'
  setTimeout(() => {
    myEmitter.emit('cardReleased', currentStatus)
  }, 5000)
}

const sendCardToWorker = (input: CreateCardInput, publish: (payload: Card) => Promise<void>) => {
  myEmitter.on('cardReleased', (status: Status) => {
    publish({ ...input, status })
  })
  worker()
}

@Resolver(_of => Card)
export default class CardResolver {
  @Query(_returns => Card)
  card() {
    return { cpf: 'mock', status: 'approved' }
  }

  @Mutation(_returns => String)
  async createCard(
    @Arg('input') input: CreateCardInput,
    @PubSub('newCard') publish: Publisher<Card>
  ) {
    sendCardToWorker(input, publish)
    return input.cpf
  }

  @Subscription(_returns => Card, {
    topics: 'newCard',
    filter: ({ payload, args }) => args.cpf === payload.cpf
  })
  newCard(
    @Root() card: Card,
    @Arg('cpf') _: string
  ): Card {
    return card
  }
}