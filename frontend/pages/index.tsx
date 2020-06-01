import { useMutation, useSubscription } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { useState } from 'react'

const SUBSCRIBE_NEWCARD = gql`
  subscription ($cpf: String!) {
    newCard (cpf: $cpf) {
      cpf
      status
    }
  }
`

const CREATE_CARD = gql`
  mutation ($input: CreateCardInput!) {
    createCard (input: $input)
  }
`

type SubscriptionData = {
  newCard?: {
    cpf: string
    status: 'approved' | 'rejected'
  }
}

type SubscribeVars = {
  cpf: string
}

type CreateCardVars = {
  input: {
    cpf: string
  }
}

type CreateCardResp = {
  createCard: string
}

const Page = () => {
  const [cpf, setCpf] = useState('')

  const [mutate] = useMutation<CreateCardResp, CreateCardVars>(CREATE_CARD)
  const { data } = useSubscription<SubscriptionData, SubscribeVars>(
    SUBSCRIBE_NEWCARD,
    {
      variables: { cpf }
    }
  )

  const createCard = () => {
    mutate({ variables: { input: { cpf } } })
  }

  return (
    <section>
      <label>Tell us your CPF</label>
      <input type='text' value={cpf} onChange={e => setCpf(e.target.value)} />
      <button onClick={createCard}>Create new card</button>
      <h4>Resposta do servidor: {data?.newCard?.status}</h4>
    </section>
  )
}

export default Page
