import './App.scss'
import Header from './components/Header'
import Content from './components/Content'
import { BrowserRouter, Route, Routes } from 'react-router'
import RegisterForm from './components/RegisterForm'
import LoginForm from './components/LoginForm'

function App() {

  return (
    <div className="app">
      <Header/>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Content />}/>
          <Route path="/register" element={<RegisterForm />}/>
          <Route path="/login" element={<LoginForm />}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
