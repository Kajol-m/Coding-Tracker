import { Github, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <>
      <footer className="bg-primary/40 pt-10 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
          {/* Brand */}
          <div className="text-center lg:text-left">
            <h3 className="text-2xl md:text-4xl lg:text-5xl font-pixel text-secondary-foreground/80 hover:text-secondary-foreground mb-3 md:mb-4">
              Pixi World !
            </h3>
            <div className="flex flex-wrap gap-2 md:gap-3 text-xs mb-4 md:mb-6 justify-center lg:justify-start">
              <Link href="/" className="bg-secondary/50 hover:bg-primary text-muted-foreground  transition-colors px-2 py-1 md:px-3 md:py-2 pixel-border-sm">
                Home
              </Link>
              <Link href="/profile" className="bg-secondary/50 hover:bg-primary text-muted-foreground  transition-colors px-2 py-1 md:px-3 md:py-2 pixel-border-sm">
                Profile
              </Link>
              <Link href="/statistics" className="bg-secondary/50 hover:bg-primary text-muted-foreground  transition-colors px-2 py-1 md:px-3 md:py-2 pixel-border-sm">
                Statistics
              </Link>
              <Link href="/stickers" className="bg-secondary/50 hover:bg-primary text-muted-foreground  transition-colors px-2 py-1 md:px-3 md:py-2 pixel-border-sm">
                Stickers
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 Coded with love and lots of coffee
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-3 md:gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary hover:bg-primary transition-colors p-2 md:p-3 pixel-border-sm group"
            >
              <Github className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground group-hover:text-primary-foreground hover:-translate-y-1 transition-transform" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary hover:bg-primary transition-colors p-2 md:p-3 pixel-border-sm group"
            >
              <Linkedin className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground group-hover:text-primary-foreground hover:-translate-y-1 transition-transform" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary hover:bg-primary transition-colors p-2 md:p-3 pixel-border-sm group"
            >
              <Instagram className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground group-hover:text-primary-foreground hover:-translate-y-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Fun Message */}
        <div className="text-center mt-4 md:mt-6 pt-3 md:pt-4 border-t-2 border-dashed border-primary/30">
          <p className="text-xs text-muted-foreground">
            Keep coding, keep growing!
          </p>
        </div>
        </div>
      </footer>
    </>
  );
}