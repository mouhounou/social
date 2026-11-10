import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/images";

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name = "", size = 40, className = "" }: Props) {
  return (
    <Image
      src={src || DEFAULT_AVATAR}
      alt={name}
      width={size}
      height={size}
      unoptimized={!src || src.startsWith("blob:")}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full bg-[#FCD877] object-cover ${className}`}
    />
  );
}
