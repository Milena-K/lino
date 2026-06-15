import { useState } from 'react';
import KnowledgeBase from './KnowledgeBase';
import SideMenu from './SideMenu';
import { ButtonContext } from '../Contexts.tsx';
import StartChat from './StartChat.tsx';
import './Content.scss';
import Chat from './Chat.tsx';

type ContentProps = {
  newChat: boolean,
}

function Content(props: ContentProps) {
  const [showKB, setShowKB] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
  const [newChat, setNewChat] = useState(false);

  const handleFirstMessage = ( message: string ) => {
    setFirstMessage(message)
    setNewChat(true)
  }

  const handleKBClose = (event: React.MouseEvent<HTMLElement>) => {
    const name = event.target.getAttribute('name');

    if (showKB && (name == null || name != 'knowledge-base')) {
      setShowKB(false);
      console.log("evaluated to true")
    }
  }

  return (
    <div className="content" onClick={handleKBClose}>
        <ButtonContext value={{ showKB, setShowKB }}>
          <SideMenu />
          <div className='middle'>
            { newChat ? <Chat firstMessage={firstMessage} /> : <StartChat setFirstMessage={handleFirstMessage}/> }
          </div>
          <KnowledgeBase />
        </ButtonContext>
    </div>
  )
}

export default Content
