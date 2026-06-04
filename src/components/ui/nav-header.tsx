"use client"; 

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export interface NavLink {
    href: string;
    label: string;
}

export function NavHeader({ links }: { links: NavLink[] }) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative mx-auto flex w-fit items-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md p-1"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {links.map((link) => (
         <Tab key={link.href} setPosition={setPosition} href={link.href}>
             {link.label}
         </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  href
}: {
  children: React.ReactNode;
  setPosition: any;
  href: string;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const isActive = pathname === href;

  // Initial position setup for active tab
  useEffect(() => {
      if (isActive && ref.current) {
          // Optional: You could make the cursor start at the active tab,
          // but usually it only appears on hover for this component design.
      }
  }, [isActive]);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-10 block cursor-pointer"
    >
      <Link 
        href={href} 
        className={clsx(
            "block px-3 py-1.5 text-xs uppercase font-bold tracking-widest transition-colors md:px-5 md:py-2 md:text-[11px]",
            isActive ? "text-red-400" : "text-neutral-400 hover:text-white"
        )}
      >
          {children}
      </Link>
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={{
          ...position,
          // Minor adjustments to make the cursor fit nicely behind the text
          top: "4px",
          height: "calc(100% - 8px)",
      }}
      transition={{
          type: "spring",
          stiffness: 400,
          damping: 30
      }}
      className="absolute z-0 rounded-full bg-white/10 border border-white/5"
    />
  );
};

export default NavHeader;
