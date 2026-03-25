import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '../../config/api.js';
import './Contact.css';

function useCountUp(to, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  useEffect(() => {
    let start = 0;
    const end = typeof to === 'number' ? to : parseInt(to.replace(/\D/g, ''));
    if (start === end) return;
    let increment = end / (duration / 16);
    let current = start;
    function update() {
      current += increment;
      if (current >= end) {
        setCount(end);
      } else {
        setCount(Math.floor(current));
        ref.current = requestAnimationFrame(update);
      }
    }
    ref.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(ref.current);
  }, [to, duration]);
  return count;
}

const ContactMap = () => (
  <div className="ContactMap">
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.024073262316!2d72.6569990751957!3d23.00601857916406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e8760d4471251%3A0xb9763f81325ae0ec!2sTalent%20Computer%20(TCIT)%20-%20Training%20Institute%20in%20Vastral!5e0!3m2!1sen!2sin!4v1717490000000!5m2!1sen!2sin"
      width="100%"
      height="400"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="TCIT Location Map"
    ></iframe>
  </div>
);

const ContactOnCampus = () => {
  const [yearsVisible, setYearsVisible] = useState(false);
  const [studentsVisible, setStudentsVisible] = useState(false);
  const yearsRef = useRef();
  const studentsRef = useRef();
  const years = useCountUp(yearsVisible ? 7 : 0, 1200);
  const students = useCountUp(studentsVisible ? 3000 : 0, 1200);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === yearsRef.current) setYearsVisible(true);
            if (entry.target === studentsRef.current) setStudentsVisible(true);
          }
        });
      },
      { threshold: 0.5 }
    );
    if (yearsRef.current) observer.observe(yearsRef.current);
    if (studentsRef.current) observer.observe(studentsRef.current);
    return () => {
      if (yearsRef.current) observer.unobserve(yearsRef.current);
      if (studentsRef.current) observer.unobserve(studentsRef.current);
    };
  }, []);

  return (
    <section className="ContactOnCampus">
      <div className="ContactOnCampus__left">
        <ContactMap />
      </div>
      <div className="ContactOnCampus__right">
        <h2 className="ContactOnCampus__heading">On Campus</h2>
        <div className="ContactOnCampus__desc">
          With over 7 years of dedicated service and more than 3000 students trained, Talent Computer (TCIT) has become a trusted name in IT education. Our experienced faculty and supportive environment empower every student to build real skills and launch a successful career in technology. Join our growing community and take your first step toward a brighter future!
        </div>
        <div className="ContactOnCampus__stats">
          <div className="ContactOnCampus__stat">
            <div className="ContactOnCampus__stat-num" ref={yearsRef}>{years}</div>
            <div className="ContactOnCampus__stat-label">Year</div>
          </div>
          <div className="ContactOnCampus__stat">
            <div className="ContactOnCampus__stat-num" ref={studentsRef}>{students}+</div>
            <div className="ContactOnCampus__stat-label">Total Student</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactForm = () => {
  const [form, setForm] = React.useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage("Message sent successfully! We'll get back to you soon.");
        setForm({ name: '', email: '', message: '' });
      } else {
        setSubmitMessage(data.message || "Failed to send message. Please try again.");
      }
    } catch {
      setSubmitMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form className="ContactForm" onSubmit={handleSubmit} autoComplete="off">
      <h2 className="ContactForm__heading">Contact Form</h2>
      <label>Name</label>
      <input name="name" value={form.name} onChange={handleChange} required />
      <label>Email</label>
      <input name="email" type="email" value={form.email} onChange={handleChange} required />
      <label>Message</label>
      <textarea name="message" value={form.message} onChange={handleChange} rows={6} required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "SENDING..." : "SUBMIT NOW"}
      </button>
      {submitMessage && (
        <div className={`ContactForm__message ${submitMessage.includes("successfully") ? "success" : "error"}`}>
          {submitMessage}
        </div>
      )}
    </form>
  );
};

const ContactInfo = () => (
  <div className="ContactInfo">
    <h2 className="ContactInfo__heading">Contact Info</h2>
    <div className="ContactInfo__section">
      <b>Head Office</b>
      <div>206, Radhe Chambers (Above SBI Bank),<br />
          Next to HP Petrol Pump,<br />
          Karnavati - Nirant Road, Vastral, Ahmedabad - 382418</div>
      <a href="tel:+919904365650">+91-9904-365650</a><br />
      <span>tcit.vastral@gmail.com</span>
    </div>
    <div className="ContactInfo__section">
      <b>Vastral Branch</b>
      <div><b>Address 1:</b><br />
        Raj Ratan Complex, Rajendra Park Char Rasta<br />
        Nr. Kaka Bhaji Pav, Odhav, Ahmedabad - 382415<br />
        <a href="tel:+919904365650">+91-9904-365650</a> <a href="tel:+916351332238">+91-6351-332238</a>
      </div>
      <div><b>Address 2:</b><br />
        H/F 11 Sahaj Residency, Above Shreeji Battery,<br />
        Patel Khaman House Complex,<br />
        Karnavati Char Rasta, Vastral, Ahmedabad - 382418<br />
        <a href="tel:+919904365650">+91-9904-365650</a> <a href="tel:+916351332238">+91-6351-332238</a><br />
        <span>tcit.vastral@gmail.com</span>
      </div>
    </div>
  </div>
);

const Contact = () => {
  return (
    <>
      <div className="ContactBanner">
        <div className="ContactBanner__overlay">
          <div className="ContactBanner__content">
            <h1>Explore Our Campuses</h1>
            <p>Our campuses are strategically placed our campuses in nine bustling metropolitan areas across the U.S. Each location offers many opportunities for aspiring IT professionals, surrounded by thriving tech industries and vibrant communities.</p>
          </div>
        </div>
      </div>
      <ContactOnCampus />
      <section className="ContactFormInfoSection">
        <ContactForm />
        <ContactInfo />
      </section>
    </>
  );
};

export default Contact;

