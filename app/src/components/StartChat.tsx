import { useContext, useEffect, useState } from 'react';
import { type Message } from '../types';
/* import { MessagesContext, UserMessageContext } from '../Contexts.tsx'; */
import './StartChat.scss';
import { useNavigate } from 'react-router';

type StartChatProps = {
  setFirstMessage: (message: string) => void,
}

function StartChat(props: StartChatProps) {
  let navigate = useNavigate();
    /* const { setMessages } = useContext(MessagesContext); */
    /* const { userMessage, setUserMessage } = useContext(UserMessageContext); */
  const [userMessage, setUserMessage] = useState("");

  useEffect(() => {
    resizeTextarea();
  }, [userMessage])

  // event listeners
  useEffect(() => {
    window.addEventListener('resize', resizeTextarea)
    window.addEventListener('load', resizeTextarea)

    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', resizeTextarea);
      window.removeEventListener('load', resizeTextarea)
    };
  }, [])

  const handleSubmit = async (event: KeyboardEvent) => {
    if(event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
    }

    if(event.key === 'Enter' && !event.shiftKey && userMessage) {
      // TODO ignore adding /n after pressing Enter
        /* const user_message: Message = {
        *   "role": "user",
        *   "content": userMessage,
        * }
        * setMessages([user_message]) */
      props.setFirstMessage(userMessage)
      let chat_uuid = crypto.randomUUID()
      navigate("/chat/chat_uuid=" + chat_uuid)
    }
  }

  const resizeTextarea = () => {
    const textarea = document.querySelector('.auto-resize-textarea');
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 2 + 'px';
  }


  return (
    <div className='start-chat'>
      <h2 className='start-title'>What is on your mind?</h2>
      <div className='textarea-container'>
        <textarea contentEditable="true" className='auto-resize-textarea'
                    value={userMessage} onChange={(e) => setUserMessage(e.target.value)}
                    rows={1} placeholder='Ask anything' onKeyDown={handleSubmit}/>
      </div>
    </div>
  )
}

export default StartChat
