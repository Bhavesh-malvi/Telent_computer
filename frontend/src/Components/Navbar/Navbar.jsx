import React, { useState, useEffect } from "react";
import "./Navbar.css";
// import logo from "../../assets/img/nav_logo.png";
import { NavLink, useLocation } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <NavLink to="/">
          <img src="/assets/img/TCIT Logo png.png" alt="Logo" />
        </NavLink>
      </div>
      <div className={`navbar-links ${open ? "active" : ""}`}>
        <NavLink to="/" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>Home</NavLink>
        <NavLink to="/why-choose-us" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>Why-Us</NavLink>
        <NavLink to="/about-us" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>About</NavLink>
        <NavLink to="/courses" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>Courses</NavLink>
        <NavLink to="/admissions" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>Admissions</NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>Contact</NavLink>
        <button className="students-login-btn">
          <NavLink to="/student-login" className="navlink">Students-Login</NavLink>
        </button>
      </div>
      <div className="navbar-toggle" onClick={() => setOpen(!open)}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </nav>
  );
};

export default Navbar; 