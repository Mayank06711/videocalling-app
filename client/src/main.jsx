import { createRoot } from 'react-dom/client'
import './index.css'
import Final from './Final.jsx'
import Apps from './App.jsx'
createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App /> // runs two time
//   </StrictMode>,
     <Apps />
    //<Final />
 )