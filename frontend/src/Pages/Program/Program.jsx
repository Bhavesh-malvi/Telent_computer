import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../../config/api.js";
import "./Program.css";

const programDetails = {
  mern: {
    title: "MERN Stack",
    img: "/src/assets/img/mern.jpg",
    subTitles: [
      "Overview of MERN Stack",
      "Career Opportunities with MERN",
      "Community and Resources",
      "Integration and Flexibility",
      "Conclusion: Why Learn MERN"
    ],
    descriptions: [
      "MERN Stack is a powerful combination of MongoDB, Express.js, React, and Node.js, enabling developers to build robust, scalable, and modern web applications. With MERN, you can handle both front-end and back-end development using JavaScript, making the development process seamless and efficient. The stack is widely used for building single-page applications, RESTful APIs, and real-time web apps. Mastering MERN opens doors to a wide range of job opportunities in the tech industry, as companies seek developers who can manage the entire application lifecycle from database to user interface.",
      "MERN Stack developers are in high demand due to the versatility and efficiency of the stack. By learning MERN, you gain expertise in both client-side and server-side programming, making you a valuable asset to any development team. The stack's reliance on JavaScript throughout the development process simplifies code management and enhances productivity. Whether you're building e-commerce platforms, social networks, or enterprise solutions, MERN provides the tools and flexibility needed to create high-quality applications.",
      "The MERN Stack ecosystem is supported by a vibrant community and a wealth of resources, including libraries, frameworks, and tools that accelerate development. As you delve deeper into MERN, you'll discover best practices for structuring projects, optimizing performance, and ensuring security. Continuous learning and hands-on experience with MERN will keep you at the forefront of web development trends and technologies.",
      "MERN Stack's modular architecture allows for easy integration of additional technologies and services, such as authentication, cloud storage, and third-party APIs. This adaptability makes MERN an ideal choice for startups and established companies alike. By mastering MERN, you'll be equipped to tackle complex development challenges and deliver innovative solutions that meet the evolving needs of users and businesses.",
      "In summary, MERN Stack is a comprehensive solution for modern web development, offering a unified language, extensive community support, and the flexibility to build a wide range of applications. Investing in MERN skills will enhance your career prospects and empower you to create impactful digital experiences."
    ]
  },
  java: {
    title: "Java Full Stack",
    img: "/src/assets/img/javafullstack.webp",
    subTitles: [
      "What is Java Full Stack?",
      "Career Growth in Java Full Stack",
      "Java's Strengths and Best Practices",
      "Industry Demand for Java Developers",
      "Summary: Java Full Stack Benefits"
    ],
    descriptions: [
      "Java Full Stack development involves working with both front-end and back-end technologies using Java as the core programming language. This approach enables developers to build scalable, secure, and high-performance web applications. Java Full Stack developers are proficient in frameworks like Spring Boot for the back end and Angular or React for the front end. The versatility of Java makes it a popular choice for enterprise-level applications, financial systems, and large-scale platforms.",
      "A career in Java Full Stack development offers numerous opportunities for growth and advancement. Companies value developers who can manage the entire application stack, from designing user interfaces to implementing business logic and managing databases. By mastering Java Full Stack, you'll be able to contribute to all phases of the software development lifecycle, making you an indispensable member of any development team.",
      "Java's strong typing, robust security features, and extensive ecosystem of libraries and tools make it an ideal choice for building reliable and maintainable applications. As a Java Full Stack developer, you'll learn best practices for code organization, testing, and deployment, ensuring that your applications are scalable and easy to maintain.",
      "The demand for Java Full Stack developers continues to grow as businesses seek to modernize their technology stacks and deliver seamless digital experiences. By staying up to date with the latest trends and advancements in Java and related technologies, you'll remain competitive in the job market and be well-positioned for career success.",
      "In conclusion, Java Full Stack development is a rewarding and dynamic field that offers the opportunity to work on diverse projects and make a significant impact. By investing in Java Full Stack skills, you'll open doors to exciting career opportunities and be prepared to tackle the challenges of modern web development."
    ]
  },
  python: {
    title: "Python Full Stack",
    img: "/src/assets/img/pythonfullstack.jpg",
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
      "Python Full Stack development emphasizes best practices for code organization, testing, and deployment, ensuring that your applications are robust, scalable, and maintainable. By learning how to integrate third-party services, manage databases, and implement security features, you'll be well-equipped to handle complex development challenges.",
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
            <h2 className="program-form-title">Start Your Journey</h2>
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" required className="program-form-input" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="program-form-input" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" type="tel" required className="program-form-input" />
            <select name="course" value={form.course} onChange={handleChange} required className="program-form-input">
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