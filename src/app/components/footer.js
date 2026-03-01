import React from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

const Footer = ({ id }) => {
  return (
    <footer
      id={id}
      className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="relative max-container padding-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex bg-white shadow-xl rounded-md  w-fit py-5 items-center justify-center md:justify-start mb-6">
              <div className=" flex h-15 items-center justify-center  relative">
                <Image src={"/logo.png"} width={225} height={206} alt="logo" className="object-contain z-2" />
              </div>
            </div>
            <p className="text-gray-300 mb-8 text-center md:text-right leading-relaxed max-w-md">
              منصة التعليم الذكي الرائدة في المنطقة العربية. نقدم تعليماً عالي
              الجودة مدعوماً بالذكاء الاصطناعي لجميع المراحل التعليمية.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61579145144491"
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebook className="w-6 h-6" />
              </a>
              <a
                href="https://x.com/academitna"
                className="w-12 h-12 bg-[#1da1f2] hover:bg-[#4d8ab0] rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter className="w-6 h-6" />
              </a>
              <a
                href="https://www.instagram.com/academitna/"
                className="w-12 h-12 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="w-6 h-6" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCGfTiSzmEVpRLSiW7bfx71Q"
                className="w-12 h-12 bg-red-700 hover:bg-red-800 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaYoutube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mx-auto border-y py-5 w-full text-center md:border-y-0 md:w-auto md:text-right md:py-0">
            <h4 className="bold-18 mb-6">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/instructors"
                  className="regular-14 text-gray-300 hover:text-[#088395] border-b border-b-red-500/0 hover:border-b-[#088395] transition-colors"
                >
                  المدرسين
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="mx-auto">
            <h4 className="bold-18 mb-6">تواصل معنا</h4>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <FaPhone className="w-5 h-5 text-accent" />
                  <p className="bold-14">واتساب</p>
                </div>
                <div className="flex gap-4 flex-wrap mr-8">
                  <a
                    href="https://wa.me/+201558546155"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25d366] bg-opacity-10 hover:bg-opacity-20 px-3 py-2 rounded-lg transition-all"
                  >
                    <FaWhatsapp className="text-white w-5 h-5" />
                    <span className="regular-14">الدعم الفني</span>
                  </a>
                  <a
                    href="https://wa.me/+201211177695"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25d366] bg-opacity-10 hover:bg-opacity-20 px-3 py-2 rounded-lg transition-all"
                  >
                    <FaWhatsapp className="text-white w-5 h-5" />
                    <span className="regular-14">الشكاوى</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaEnvelope className="w-5 h-5 text-accent" />
                <div>
                  <p className="regular-14 text-gray-300">البريد الإلكتروني</p>
                  <p className="bold-14">academitna@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="w-5 h-5 text-accent" />
                <div>
                  <p className="regular-14 text-gray-300">العنوان</p>
                  <p className="bold-14">الإسكندرية، مصر</p>
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
  );
};

export default Footer;
