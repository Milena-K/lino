import { useEffect, useState } from 'react';
import './Content.scss';
import KnowledgeBase from './KnowledgeBase';
import SideMenu from './SideMenu';
import { ButtonContext } from '../Contexts';

type Message = {
  role: "user" | "assistant",
  content: string
}

function Content() {
  const [showKB, setShowKB] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [prompt, setPrompt] = useState("");

  const handleKBClose = (event) => {
    const name = event.target.getAttribute('name');

    if (showKB && (name == null || name != 'knowledge-base')) {
      setShowKB(false);
      console.log("evaluated to true")
    }
  }

  const getAssistantResponse = async (messages: Message[]) => {
    const data = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ "messages": messages})
    }
    const res = await fetch('http://localhost:8000/chat', data)
    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let out = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      out += decoder.decode(value)
      setReply(out)
    }
  }

  const handleSubmit = (event: KeyboardEvent) => {
    if(event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
    }

    if(event.key === 'Enter' && !event.shiftKey && prompt) {
      const user_message: Message = {
        "role": "user",
        "content": prompt,
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
      setPrompt("");
      getAssistantResponse(new_messages);
    }
  }

  const resizeTextarea = () => {
    const textarea = document.querySelector('.auto-resize-textarea');
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 2 + 'px';
  }

  useEffect(() => {
    resizeTextarea();

  }, [prompt])

  useEffect(() => {
    window.addEventListener('resize', resizeTextarea)
    window.addEventListener('load', resizeTextarea)

    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', resizeTextarea);
      window.removeEventListener('load', resizeTextarea)
    };
  }, [])

  return (
    <div className="content" onClick={handleKBClose}>
      <ButtonContext value={[showKB, setShowKB]}>
        <SideMenu />
        <div className='middle'>
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
                        value={prompt} onChange={(e) => setPrompt(e.target.value)}
                        rows={1} placeholder='Ask anything' onKeyDown={handleSubmit}/>
            </div>
          </div>
        </div>

        <KnowledgeBase />
      </ButtonContext>
    </div>
  )
}

export default Content
