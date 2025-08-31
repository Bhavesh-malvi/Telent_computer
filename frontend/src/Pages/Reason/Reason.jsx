import React from 'react'
import './Reason.css'
import ReasonSection from '../../Components/ReasonSection/ReasonSection'

const Reason = () => {
    return (
        <>
            <div className="ReasonBanner">
                <div className="ReasonBanner__overlay">
                    <div className="ReasonBanner__content">
                        <h1>TOP REASONS TO CHOOSE<br/>TALENT COMPUTER INSTITUTE</h1>
                        <p>No need to spend years navigating the complexities of IT when you can kickstart your journey in just a few months.</p>
                        <p>Discover why Talent Computer Institute is the right choice for you!</p>
                    </div>
                </div>
            </div>
            <ReasonSection />
        </>
    )
}

export default Reason