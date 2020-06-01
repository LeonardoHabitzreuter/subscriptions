import EventEmitter from 'events'
import { Field, ObjectType, Query, Resolver, Mutation, Arg, InputType, Subscription, Publisher, PubSub, Root } from 'type-graphql'

const myEmitter = new EventEmitter();

type Status = 'approved' | 'rejected'

@ObjectType()
class Card {
  @Field()
  cpf: string

  @Field()
  status: Status
}

@InputType()
class CreateCardInput {
  @Field()
  cpf: string
}

const worker = (cpf: string) => {
  setTimeout(() => {
    myEmitter.emit('cardReleased', {
      cpf,
      status: cpf === '123' ? 'approved' : 'rejected'
    })
  }, 5000)
}

const sendCardToWorker = (input: CreateCardInput, publish: (payload: Card) => Promise<void>) => {
  myEmitter.on('cardReleased', (card: Card) => {
    publish(card)
  })
  worker(input.cpf)
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
    nullable: true,
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