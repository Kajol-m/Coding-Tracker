"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, ReactNode, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>, LinkProps {
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  href: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, href, children, ...props }, ref) => {
    const pathname = usePathname();
    
    // Check if the current route matches the link
    const isActive = pathname === href || pathname.startsWith(href + "/");

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          className,
          isActive && activeClassName,
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };