import './App.scss'
import Header from './components/Header'
import Chat from './components/Chat'
import StartChat from './components/StartChat.tsx';
import RegisterForm from './components/RegisterForm'
import LoginForm from './components/LoginForm'
import KnowledgeBase from './components/KnowledgeBase';
import SideMenu from './components/SideMenu';
import { ChatContextProvider, ButtonContext, MessagesContext, TitleContext, UserMessageContext } from './Contexts.tsx';
import { useContext, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import './components/Content.scss';

function App() {
  const { messages, setMessages } = useContext(MessagesContext);
  const { title, setTitle } = useContext(TitleContext);
  const { userMessage, setUserMessage } = useContext(UserMessageContext);
  const [showKB, setShowKB] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
    /* const [newChat, setNewChat] = useState(false); */

  const handleFirstMessage = ( message: string ) => {
    setFirstMessage(message)
  }

  const handleKBClose = (event: React.MouseEvent<HTMLElement>) => {
    const name = event.target.getAttribute('name');

    if (showKB && (name == null || name != 'knowledge-base')) {
      setShowKB(false);
      console.log("evaluated to true")
    }
  }
  return (
    <BrowserRouter>
    <div className="app">
      <Header/>
      <ChatContextProvider messages={messages} setMessages={setMessages}
                           title={title} setTitle={setTitle}
                           userMessage={userMessage} setUserMessage={setUserMessage}>
      <div className="content" onClick={handleKBClose}>
        <ButtonContext value={{ showKB, setShowKB }}>
          <SideMenu />
          <div className='middle'>
              <Routes>
                <Route path="/" element={<StartChat setFirstMessage={handleFirstMessage}/>}/>
                <Route path="/chat/:chat_uuid" element={<Chat firstMessage={firstMessage} />}/>
                <Route path="/register" element={<RegisterForm />}/>
                <Route path="/login" element={<LoginForm />}/>
              </Routes>
          </div>
          <KnowledgeBase />
        </ButtonContext>
      </div>
      </ChatContextProvider>
    </div>
    </BrowserRouter>
  )
}

export default App
