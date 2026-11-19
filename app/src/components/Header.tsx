import "./Header.scss"
import LinoLogo from "../assets/lino.png"

function Header() {
  const handleClick = () => {
  }

  return (
    <div className="header">
      <img src={LinoLogo} className="logo" />
      <p className="name">LINO</p>
      {/* <button className="icon" onClick={() => alert("click")}> */}
      <div className="icon" onClick={() => alert("click")}>
        M
      </div>
    </div>
  )
}

export default Header
