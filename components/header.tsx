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
      bg-white"
    >
      {/* Logo */}
      <div className="flex flex-row items-center justify-between w-full max-w-6xl mx-auto px-[25px] md:px-[0px]">
        <div className="flex flex-row items-start justify-center gap-[8px]">
          <Image src="/Logo.png" alt="Logo" width={32} height={28} />
          <Image
            src="/Logo2.png"
            alt="Logo"
            width={56}
            height={18}
            className="mt-1"
          />
        </div>
  
        {/* Action Buttons */}
        <div className="space-x-4 items-end">
          <UserNav />
        </div>
      </div>
    </header>
  );
};

export default Header;
