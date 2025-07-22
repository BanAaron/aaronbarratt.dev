import {NavLink} from "react-router";
import './Navigation.scss'

function Navigation() {
    return (
        <nav>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about" end>ABOUT</NavLink>
        </nav>
    )
}

export default Navigation
