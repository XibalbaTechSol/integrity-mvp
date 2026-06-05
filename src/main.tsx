import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Web3ModalProvider } from './components/Web3ModalProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3ModalProvider>
      <App />
    </Web3ModalProvider>
  </React.StrictMode>,
)
