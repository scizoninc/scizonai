import { streamText } from 'ai'


const result = streamText({
  model: 'openai/gpt-5',
  prompt: 'Why is the sky blue?'
})
