import { useEffect, useState } from 'react';
import { type Message } from '../types';
import './Chat.scss';
import { useParams } // Load Web Workers
from 'react-router';

type ChatProps = {
    firstMessage: string,
}


function Chat(props: ChatProps) {
  let { chat_uuid } = useParams();
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState<string>("");
  const [userMessage, setUserMessage] = useState<string>("");
  const [done, setDone] = useState<boolean>(true);
  const worker = new Worker(new URL("../chat-worker.js", import.meta.url), {type: "module"});

  useEffect(() => {
    if (done) {
      // TODO save chat to db
    }

  }, [done])

  useEffect(() => {
    resizeTextarea();
  }, [userMessage])

  useEffect(() => {
    if( messages.length > 0 )
      sendMessages(props.firstMessage)

    // event listeners
    window.addEventListener('resize', resizeTextarea)
    window.addEventListener('load', resizeTextarea)
    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', resizeTextarea);
      window.removeEventListener('load', resizeTextarea)
    };
  }, [])

  const getAssistantResponse = (new_messages: Message[]) => {
    if(worker) {
      worker.postMessage({ action: "getAssistantMessage", data: new_messages })
    }
    worker.onmessage = (event) => {
      // TODO check if event.data has "done": true,
      // if yes, then set flag done to true and save chat to db
      setReply(event.data);
      console.log(event.data)
    }
  }

  const sendMessages = (message: string) => {
      const user_message: Message = {
        "role": "user",
        "content": message,
      }
      const assistant_message: Message = {
        "role": "assistant",
        "content": reply,
      }
      let new_messages;
      if (reply) {
        new_messages = [...messages, assistant_message, user_message]
      } else {
        new_messages = [...messages, user_message]
      }
      setMessages(new_messages)
      setReply("")
      setUserMessage("")

      getAssistantResponse(new_messages)
  }

  const handleSubmit = (event: KeyboardEvent) => {
    if(event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
    }

    if(event.key === 'Enter' && !event.shiftKey && userMessage) {
      sendMessages(userMessage)
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
              messages.map((message: Message, index) => (
              <div key={index} className={message.role + "-message"}>
                  {message.content}
              </div>
              ))
          }
          <div className='assistant-message'>{reply}</div>
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
