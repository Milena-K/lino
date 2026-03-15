import { useState } from 'react';
import './Content.scss'
import KnowledgeBase from './KnowledgeBase'
import SideMenu from './SideMenu'
import { ButtonContext } from '../Contexts';


function Content() {
  const [showKB, setShowKB] = useState(false);

  const handleKBClose = (event: MouseEvent) => {
    const name = event.target.getAttribute('name');

    if (showKB && (name == null || name != 'knowledge-base')) {
      setShowKB(false);
      console.log("evaluated to true")
    }
  }

  return (
    <div className="content" onClick={handleKBClose}>
      <ButtonContext value={[showKB, setShowKB]}>
        <SideMenu />

        <div className='middle'>
          <div className='chat'>
            <div className='messages-area'>
              messages
            </div>
            <div className='message-composer'>
              <div contentEditable="true" className='message-input' placeholder='Ask anything' />
            </div>
          </div>
        </div>

        <KnowledgeBase />
      </ButtonContext>
    </div>
  )
}

export default Content
