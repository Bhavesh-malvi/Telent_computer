import Navbar from './Navbar/Navbar';
import Footer from './Footer/Footer';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
} 