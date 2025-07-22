import './Header.scss'
import Navigation from "./Navigation.tsx";

function Header() {
    return (
        <header>
            <div className={"thick-boarder header-title"}>
                <h1>Aaron Barratt</h1>
            </div>
            <Navigation/>
        </header>
    )
}

export default Header
