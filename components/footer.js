import React from 'react'
import { FaGraduationCap, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, } from 'react-icons/fa';
import Link from 'next/link';

const Footer = ({id}) => {
  return (
      <footer id={id} className="bg-gray-900 text-white py-16">
        <div className="max-container padding-container">
          <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Company Info */}
            <div className='max-w-[400px] mx-auto text-center'>
              <div className="flexCenter gap-2 mb-6">
                <FaGraduationCap className="w-8 h-8 text-accent" />
                <h3 className="bold-24">أكاديميتنا</h3>
              </div>
              <p className="regular-14 text-gray-300 mb-6">
                منصة التعليم الرقمي الرائدة في مصر، نقدم تعليماً عالي الجودة
                لجميع المراحل التعليمية بأحدث التقنيات.
              </p>
              <div className="flexCenter gap-4">
                <a href="https://www.facebook.com" className="w-10 h-10 bg-accent rounded-full flexCenter hover:bg-opacity-80 transition-colors">
                  <FaFacebook className="w-5 h-5" />
                </a>
                <a href="https://x.com/?lang=en" className="w-10 h-10 bg-accent rounded-full flexCenter hover:bg-opacity-80 transition-colors">
                  <FaTwitter className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com" className="w-10 h-10 bg-accent rounded-full flexCenter hover:bg-opacity-80 transition-colors">
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com" className="w-10 h-10 bg-accent rounded-full flexCenter hover:bg-opacity-80 transition-colors">
                  <FaLinkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className='mx-auto border-y py-5 w-full text-center md:border-y-0 md:w-auto md:text-right md:py-0'>
              <h4 className="bold-18 mb-6">روابط سريعة</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/instructors" className="regular-14 text-gray-300 hover:text-[#088395] border-b border-b-red-500/0 hover:border-b-[#088395] transition-colors">
                    المدرسين
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className='mx-auto'>
              <h4 className="bold-18 mb-6">تواصل معنا</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaPhone className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-300">الهاتف</p>
                    <p className="bold-14">+20 123 456 7890</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FaEnvelope className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-300">البريد الإلكتروني</p>
                    <p className="bold-14">info@academy.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="w-5 h-5 text-accent" />
                  <div>
                    <p className="regular-14 text-gray-300">العنوان</p>
                    <p className="bold-14">القاهرة، مصر</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <p className="regular-14 text-center text-gray-400">
              © 2025 أكاديميتنا. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
  )
}

export default Footer