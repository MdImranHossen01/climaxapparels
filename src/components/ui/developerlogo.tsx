import Image from 'next/image';
import Link from 'next/link';

interface DeveloperLogoProps {
  className?: string;
}

const DeveloperLogo = ({ className = "" }: DeveloperLogoProps) => {
  return (
    <Link 
      href="https://www.jiapixel.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 group transition-all duration-300 hover:opacity-80 ${className}`}
    >
      <span className="text-[10px] text-neutral-600 dark:text-neutral-300 font-medium uppercase tracking-wider">
        Developed by
      </span>
      <div className="flex items-center gap-1">
        <Image
          src="/Jia-Pixel-Logo.png"
          alt="Jia Pixel Logo"
          width={18}
          height={18}
          className="grayscale group-hover:grayscale-0 transition-all duration-300"
        />
        <div className="flex items-baseline font-bold leading-none">
          <span className="text-xs tracking-tight text-foreground">JIA</span>
          <span className="text-[9px] text-foreground/90 font-black ml-0.5">PIXEL</span>
        </div>
      </div>
    </Link>
  );
};

export default DeveloperLogo;

