import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  { name: "Instagram", url: "https://www.instagram.com/mamatha__raj.photography/" },
  { name: "Facebook", url: "https://www.facebook.com/PhotriyaPhotography/" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="MamathaRaj Photography"
            width={36}
            height={36}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-sm font-medium text-foreground">MamathaRaj Photography</span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-foreground/5 hover:text-foreground"
            >
              {link.name}
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} MamathaRaj Photography
        </p>
      </div>
    </footer>
  );
}
