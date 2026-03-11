import "./Header.scss"
import LinoLogo from "../assets/lino.png"

function Header() {

  return (
    <div className="header">
      <img src={LinoLogo} className="logo" />
      <p className="name">LINO</p>
      <p className="icon">M</p>
    </div>
  )
}

export default Header
