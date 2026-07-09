import React from 'react'
import './Reason.css'
import ReasonSection from '../../Components/ReasonSection/ReasonSection'
import { useSEO } from '../../hooks/useSEO'

const Reason = () => {
    useSEO({
        title: "Why Choose TCIT | Talent Computer Institute",
        description: "Discover the top reasons to join Talent Computer Institute: hands-on coding labs, expert certification trainers, job assistance, and flexible batch timings.",
        keywords: "why choose tcit, best computer classes, software training benefits"
    });

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