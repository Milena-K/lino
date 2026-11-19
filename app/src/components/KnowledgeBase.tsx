import { useContext, useEffect } from "react"
import "./KnowledgeBase.scss"
import { ButtonContext } from "../Contexts.tsx"


function KnowledgeBase() {
  const { showKB, setShowKB } = useContext(ButtonContext)

  useEffect(() => {
    if (showKB && window.innerWidth < 991){
      setShowKB(false)
    }
  }, [window.innerWidth])

  return (
    <div className={"knowledge-base " + (!showKB ? "hide ": "")}>
      Knowledge base
    </div>
  )
}

export default KnowledgeBase
