import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../../config/api.js";
import emailjs from '@emailjs/browser';
import mernImg from "../../assets/img/mern.jpg";
import AIMLImg from "../../assets/img/AI ML.webp";
import pythonImg from "../../assets/img/pythonfullstack.jpg";
import "./Program.css";

const programDetails = {
  mern: {
    title: "MERN Stack",
    img: mernImg,
    subTitles: [
      "Overview of MERN Stack",
      "Career Opportunities with MERN",
      "Community and Resources",
      "Integration and Flexibility",
      "Conclusion: Why Learn MERN"
    ],
   descriptions: [
      "MERN Stack combines MongoDB, Express.js, React, and Node.js to help developers build robust, scalable, and modern web applications. Using JavaScript for both front-end and back-end makes development seamless and efficient. MERN is widely used for single-page applications, RESTful APIs, and real-time web apps. Mastering MERN opens doors to a wide range of high-demand tech jobs.",

      "MERN developers are highly sought after due to the stack's versatility and efficiency. Learning MERN gives you expertise in both client-side and server-side development, making you a valuable asset to any team. From e-commerce platforms to enterprise solutions, MERN equips you to build high-quality applications and manage the entire application lifecycle.",

      "The MERN ecosystem is backed by a vibrant community and rich resources, including libraries, frameworks, and tools. By exploring MERN, you'll learn best practices for project structure, performance optimization, and security, keeping your skills aligned with the latest web development trends.",

      "MERN and modular architecture allow easy integration with additional technologies like authentication, cloud storage, and third-party APIs. This adaptability makes it ideal for startups and established companies alike, enabling you to tackle complex projects and deliver innovative solutions.",

      "MERN Stack offers a unified language, strong community support, and flexible development capabilities. Investing in MERN enhances your career prospects and empowers you to create impactful digital experiences."
    ]
  },
  aiml: {
    title: "AI & ML",
    img: AIMLImg,
    subTitles: [
      "What is AI & ML?",
      "Career Growth in AI & ML",
      "Java's Strengths in AI/ML (Backend focus)",
      "Industry Demand for AI/ML Experts",
      "Summary: AI & ML Core Benefits"
    ],
    descriptions: [
      "Machine Learning and Artificial Intelligence represent the frontier of computational science, focusing on the development of systems capable of autonomous reasoning and pattern recognition. Unlike traditional software that relies on static rules, AI leverages complex mathematical models and neural networks to analyze vast datasets, enabling machines to learn from experience and improve their performance over time. This domain encompasses everything from predictive analytics to sophisticated deep learning architectures that power modern innovations.",

      "A specialization in AI and Machine Learning offers an elite career trajectory within the global technology sector. As organizations transition toward data-driven operations, the demand for specialists who can architect intelligent systems—such as Computer Vision, Natural Language Processing (NLP), and autonomous decision engines—is at an all-time high. Mastery in this field positions professionals for high-impact roles like AI Research Scientists and MLOps Engineers, providing long-term career resilience and the opportunity to lead transformative technological shifts.",

      "While Python is renowned for research, Java serves as the backbone for industrial-scale AI deployment and high-performance backend integration. Java’s robust memory management, multithreading capabilities, and mature ecosystem—including frameworks like Deeplearning4j—make it a preferred choice for executing large-scale machine learning pipelines. It provides the necessary stability and speed required for enterprise-level AI applications that must handle massive concurrent workloads and real-time data processing with uncompromising reliability.",

      "The global economy is currently undergoing an intelligence revolution, where businesses across healthcare, finance, and manufacturing are prioritizing AI integration to maintain a competitive edge. There is a critical talent gap for experts who can not only build sophisticated models but also optimize them for production environments. Consequently, professionals skilled in deploying scalable AI solutions are witnessing unprecedented demand, as industries seek to automate complex processes and derive predictive insights from their big data assets.",

      "In summary, AI and Machine Learning empower organizations to transcend human limitations by automating complex cognitive tasks and delivering high-precision predictive analytics. By shifting from manual logic to data-driven intelligence, these technologies enhance operational efficiency, reduce systemic errors, and enable a level of personalization previously thought impossible. Investing in AI/ML expertise is about more than just programming; it is about building the fundamental intelligence that will drive the next generation of global innovation."
    ]
  },
  python: {
    title: "Python Full Stack",
    img: pythonImg,
    subTitles: [
      "Introduction to Python Full Stack",
      "Industry Applications of Python Full Stack",
      "Best Practices in Python Full Stack",
      "Flexibility and Rapid Prototyping",
      "Summary: Python Full Stack Advantages"
    ],
    descriptions: [
      "Python Full Stack development combines the simplicity and power of Python with modern front-end technologies to create dynamic and responsive web applications. Python is known for its readability, versatility, and extensive library support, making it a popular choice for both beginners and experienced developers. As a Python Full Stack developer, you'll work with frameworks like Django or Flask on the back end and React or Angular on the front end.",

      "The role of a Python Full Stack developer is highly sought after in industries ranging from finance and healthcare to education and technology. By mastering both front-end and back-end development with Python, you'll be able to build end-to-end solutions that meet the needs of users and businesses alike. Python's strong community support and wealth of resources make it easy to learn and stay up to date with the latest trends.",

      "Python Full Stack development emphasizes best practices for code organization, testing, and deployment, ensuring that your applications are robust, scalable, and maintainable. By learning how to integrate third-party services, manage databases, and implement security features, you'll be well equipped to handle complex development challenges.",

      "The flexibility of Python allows for rapid prototyping and iteration, making it an ideal choice for startups and innovative projects. As a Python Full Stack developer, you'll be able to quickly turn ideas into functional applications and deliver value to users and stakeholders.",

      "In summary, Python Full Stack development is a versatile and rewarding career path that offers the opportunity to work on a wide range of projects. By investing in Python Full Stack skills, you'll enhance your career prospects and be prepared to succeed in the ever-evolving world of web development."
    ]
  }
};

const Program = () => {
  const location = useLocation();
  const { course } = location.state || {};
  const details = programDetails[course?.id];
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", course: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      // Submit to EmailJS
      emailjs.send(
        'service_ir1yl1w',
        'template_7tkit6o',
        {
          form_type: 'Enrollment Form',
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          course: form.course,
          message: `New enrollment for ${form.course}`
        },
        'xFAJ7RxNAxCU6M4u5'
      ).catch(err => console.error("EmailJS Error:", err));

      // Submit to backend
      const response = await fetch(`${API_URL}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage("Enrollment submitted successfully! We'll contact you soon.");
        setForm({ fullName: "", email: "", phone: "", course: "" });
      } else {
        setSubmitMessage(data.message || "Failed to submit enrollment. Please try again.");
      }
    } catch {
      setSubmitMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!details) return <div>Program not found.</div>;

  return (
    <div>
      {/* Banner Section */}
      <div className="program-banner">
        <div className="program-banner-overlay">
          <div className="program-banner-content">
            <h1 className="program-banner-title">Inquire and Explore IT Careers</h1>
          </div>
        </div>
      </div>
      {/* Main Content Section */}
      <div className="program-main-content">
        <div className="program-content-section">
          <img src={details.img} alt={details.title} className="program-main-img" />
          <h1 className="program-main-title">{details.title}</h1>
          {details.descriptions.map((desc, idx) => (
            <div key={idx}>
              <h3 className="program-desc-title">{details.subTitles[idx]}</h3>
              <p className="program-desc-text">{desc}</p>
            </div>
          ))}
        </div>
        <div className="program-form-wrapper">
          <form onSubmit={handleSubmit} className="program-form">
            <h2 className="program-form-title">Enroll Now for {details.title} free demo class</h2>
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" required className="program-form-input" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="program-form-input" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" type="tel" required className="program-form-input" />
            <select name="course" value={form.course} onChange={handleChange} required className="program-form-input select-input">
              <option value="" disabled>Select Course</option>
              <option value="Mern Stack">Mern Stack</option>
              <option value="Java Full Stack">Java Full Stack</option>
              <option value="Python Full Stack">Python Full Stack</option>
            </select>
            <button type="submit" className="program-form-btn" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Now"}
            </button>
            {submitMessage && (
              <div className={`program-form-message ${submitMessage.includes("successfully") ? "success" : "error"}`}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Program; 