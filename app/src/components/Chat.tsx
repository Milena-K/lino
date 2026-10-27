import { useEffect, useState } from 'react';
import { type Message } from '../types';
import './Chat.scss';
import { useParams } 
from 'react-router';
import * as openpgp from 'openpgp';
// Load Web Workers
const chat_worker = new Worker(new URL("../chat-worker.js", import.meta.url), {type: "module"});
// const auth_worker = new Worker(new URL("../auth-worker.js", import.meta.url), {type: "module"});

type ChatProps = {
    firstMessage: string,
}


function Chat(props: ChatProps) {
  let { chat_uuid } = useParams();
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState<string>("");
  const [userMessage, setUserMessage] = useState<string>("");
  const [save, setSave] = useState<boolean>(false);

  useEffect(() => {
    if(save) {
      saveChat();
      setSave(false)
    }
  }, [save])

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
    if(chat_worker) {
      chat_worker.postMessage({
        action: "getAssistantMessage",
        messages: new_messages,
        chat_uuid: chat_uuid,
      })
    }
    chat_worker.onmessage = (event) => {
      setReply(event.data);
      setSave(true);
      console.log(event.data);
    }
  }

  const sendMessages = () => {
      const user_message: Message = {
        "role": "user",
        "content": userMessage,
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

  const saveChat = () => {
    if( chat_worker ) {
      console.log(userMessage)
      chat_worker.postMessage({action: "save", messages: userMessage})
      chat_worker.onerror = (e) => {
        console.log(e)
        alert(e.message)
      }
    }
  }

  const handleSubmit = (event: KeyboardEvent) => {
    if(event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
    }

    if(event.key === 'Enter' && !event.shiftKey && userMessage) {
        if(chat_worker) {
          if (messages.length == 0) {
            const user_message: Message = {
                "role": "user",
                "content": userMessage,
            }
            let data = {
              action: "createChat",
              messages: [user_message],
              chat_uuid: chat_uuid,
            }
            chat_worker.postMessage(data)
            chat_worker.onmessage = (event) => {
              console.log(event.data);
              // setMessages([user_message])  
            }
            chat_worker.onerror = (e) => {
              console.log(e)
            }
          } 
          // TODO uncomment this
          // getAssistantResponse(messages) // Note messages might not be updated with latest data at this point
          // sendMessages()
        }
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
