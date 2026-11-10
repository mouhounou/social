import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/images";

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  fluid?: boolean;
};

export default function Avatar({ src, name = "", size = 40, className = "", fluid = false }: Props) {
  return (
    <Image
      src={src || DEFAULT_AVATAR}
      alt={name}
      width={size}
      height={size}
      unoptimized={!src || src.startsWith("blob:")}
      style={fluid ? undefined : { width: size, height: size }}
      className={`shrink-0 rounded-full bg-[#FCD877] object-cover ${fluid ? "size-full" : ""} ${className}`}
    />
  );
}
