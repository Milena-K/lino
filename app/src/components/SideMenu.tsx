import { useContext, useState } from "react";
import "./SideMenu.scss"
import { SlArrowLeftCircle } from "react-icons/sl";
import { RiBookLine } from "react-icons/ri";
import { AiOutlineFile } from "react-icons/ai";
import { ButtonContext, MessagesContext, UserMessageContext, TitleContext } from "../Contexts.tsx";
import { NavLink } from "react-router";

function SideMenu() {
  const [showMenu, setShowMenu] = useState(true);
  const { showKB, setShowKB } = useContext(ButtonContext)
  const { setMessages } = useContext(MessagesContext)
  const { setTitle } = useContext(TitleContext)
  const { setUserMessage } = useContext(UserMessageContext)

  const clearChat = () => {
    setMessages([])
    setTitle("")
    setUserMessage("")
    console.log("cleared.")
  }

  return (
    <div className="side-menu">
      <div className={"menu " + (showMenu ? "hide ": "")}>
        <NavLink to="/"><button className="btn" onClick={clearChat}>New chat</button></NavLink>
      </div>

      <div className="btns">
        <button className='btn' onClick={() => setShowKB(!showKB)}>
          <RiBookLine className='btn-img' size="2em"/>
        </button>
        <button className='btn'>
          <AiOutlineFile className='btn-img' size="2em"/>
        </button>
        <button className={"back-btn"} onClick={() => setShowMenu(!showMenu)}>
          <SlArrowLeftCircle size="2em" className={"back-btn-img" + (showMenu ? "" : " closed")} />
        </button>
      </div>
    </div>
  )
}

export default SideMenu
