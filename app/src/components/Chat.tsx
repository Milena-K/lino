import { useEffect, useState } from 'react';
import { type Message } from '../types';
import './Chat.scss';
import { useParams } 
from 'react-router';
import * as openpgp from 'openpgp';
import { useChatWorker } from './useChatWorker'

type ChatProps = {
    firstMessage: string,
}


function Chat(props: ChatProps) {
  const { text, createChat, sendChat, saveChat, isStreaming } = useChatWorker()
  let { chat_uuid } = useParams();
  const [reply, setReply] = useState("");
  const test_messages: Message[] = [
    {
      role: "user",
      content: "test"
    },
    {
      role: "assistant",
      content: "hi test!"
    },
  ]
  const [messages, setMessages] = useState<Message[]>(test_messages);
  const [title, setTitle] = useState<string>("");
  const [userMessage, setUserMessage] = useState<string>("");


  useEffect(() => {
    resizeTextarea();
  }, [userMessage])

  useEffect(() => {
    if (!isStreaming) {
      saveChat(messages, chat_uuid)
    }
    
  }, [isStreaming])

  useEffect(() => {
    if(props.firstMessage) {
      const user_message: Message = {
        "role": "user",
        "content": props.firstMessage,
      }
      setMessages([...messages, user_message]) // TODO remove ...messages after removing test_messages
      createChat(user_message, chat_uuid)
      sendChat([user_message], chat_uuid)
    }
    // event listeners
    window.addEventListener('resize', resizeTextarea)
    window.addEventListener('load', resizeTextarea)
    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', resizeTextarea);
      window.removeEventListener('load', resizeTextarea)
    };
  }, [])

  // const sendMessages = () => {
  //     const assistant_message: Message = {
  //       "role": "assistant",
  //       "content": reply,
  //     }
  //     let new_messages;
  //     if (reply) {
  //       new_messages = [...messages, assistant_message, user_message]
  //     } else {
  //       new_messages = [...messages, user_message]
  //     }
  //     setMessages(new_messages)
  //     setReply("")
  //     setUserMessage("")
  // }

  const handleSubmit = (event: KeyboardEvent) => {
    if(event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
    }
    if(event.key === 'Enter' && !event.shiftKey && userMessage) {
      const user_message: Message = {
        "role": "user",
        "content": userMessage,
      }
      setMessages([...messages, user_message])
      sendChat(messages, chat_uuid)
    }
  }

  const resizeTextarea = () => {
    const textarea = document.querySelector('.auto-resize-textarea');
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 2 + 'px';
  }

  return (
      <>
        <div className='chat'>
          <div className='messages-area'>
            {
              messages ?
              messages.map((message: Message, index) => (
              <div key={index} className={message.role + "-message"}>
                  {message.content}
              </div>
              )) : null
            }
            <div className='assistant-message'>{text}</div> 
          </div>
          <div className='textarea-container'>
          <textarea contentEditable="true" className='auto-resize-textarea'
                      value={userMessage} onChange={(e) => setUserMessage(e.target.value)}
                      rows={1} placeholder='Ask anything' onKeyDown={handleSubmit}/>
          </div>
        </div>
      </>
  )
}

export default Chat
