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

  const handleKBClose = (event: MouseEvent) => {
    const name = event.target.getAttribute('name');

    if (showKB && (name == null || name != 'knowledge-base')) {
      setShowKB(false);
      console.log("evaluated to true")
    }
  }

  const handleSubmit = async (event: KeyboardEvent) => {
    if(event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
    }
    if(event.key === 'Enter' && !event.shiftKey) {
      // const prompt = event.target?.innerText;
      const user_message: Message = {
        "role": "user",
        "content": prompt,
      }
      const assistant_message: Message = {
        "role": "assistant",
        "content": reply,
      }
      setPrompt("");

      let new_messages;
      if (reply) {
        new_messages = [...messages, assistant_message, user_message]
      } else {
        new_messages = [...messages, user_message]
      }
      setMessages(new_messages)
      const data = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "messages": new_messages})
      }
      const res = await fetch('http://localhost:8000/chat', data)
      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let out = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        //out += decoder.decode(value, { stream: true });
        console.log(value)
        out += decoder.decode(value)
        setReply(out)
      }
    }
  }



  return (
    <div className="content" onClick={handleKBClose}>
      <ButtonContext value={[showKB, setShowKB]}>
        <SideMenu />

        <div className='middle'>
          <div className='chat'>
            <div id='messages' className='messages-area'>
              {
                messages.map((message:Message, index) => <div key={index}>{message.content}</div>)
              }
              { reply }
            </div>
            {/*<div className='message-composer'>
              <div id="message-input" contentEditable="true" className='message-input'
                   placeholder='Ask anything' onKeyDown={handleSubmit} />
            </div>*/}
            <input placeholder='Ask anything' value={prompt}
                   onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleSubmit} />
          </div>
        </div>

        <KnowledgeBase />
      </ButtonContext>
    </div>
  )
}

export default Content
