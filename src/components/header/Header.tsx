import './Header.scss'
import Navigation from "./Navigation.tsx";

function Header() {
    return (
        <header>
            <div className="container">
                <div className={"title"}>
                    <h1>Aaron Barratt</h1>
                </div>
            </div>
            <Navigation/>
        </header>
    )
}

export default Header
