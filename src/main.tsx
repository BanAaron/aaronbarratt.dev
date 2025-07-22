import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router'
import './index.scss'
import Home from './pages/home/Home.tsx'
import About from './pages/about/About.tsx'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route index element={<Home/>}/>
            <Route path="/about" element={<About/>}/>
        </Routes>
    </BrowserRouter>
)
