import {NavLink} from "react-router";
import './Navigation.scss'

function Navigation() {
    return (
        <nav>
            <ul>
                <li><NavLink to="/" end>HOME</NavLink></li>
                <li><NavLink to="/about" end>ABOUT</NavLink></li>
                <li><NavLink to="/games" end>GAMES</NavLink></li>
                <li><NavLink to="/blog" end>BLOG</NavLink></li>
                <li><NavLink to="/somehthing" end>SOMETHING</NavLink></li>
                <li><NavLink to="/contact" end>CONTACT</NavLink></li>
            </ul>
        </nav>
    )
}

export default Navigation
