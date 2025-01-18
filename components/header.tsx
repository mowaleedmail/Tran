/* eslint-disable @typescript-eslint/no-unused-vars */
import Image from "next/image";
import React from "react";
import { UserNav } from "./user-nav";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

const Header: React.FC = () => {
  return (
    <header
      className="flex flex-row
      items-center justify-between
      sticky top-0 z-40 w-full
      border-b
      border-gray-200
      h-[75px]
      px-[150px]
      bg-white"
    >
      {/* Logo */}
      <div className="flex items-center gap-[8px]">
        <Image src="/Logo.png" alt="Logo" width={32} height={28} unoptimized />
        <Image src="/Logo2.png" alt="Logo" width={56} height={18} unoptimized />
      </div>

      {/* Navigation Links */}
      {/* <nav>
        <ul className="flex space-x-6 items-center">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-gray-600 hover:text-blue-500 transition duration-300"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav> */}

      {/* Action Buttons */}
      <div className="space-x-4">
        <UserNav />
      </div>
    </header>
  );
};

export default Header;
