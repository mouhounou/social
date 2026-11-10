import Image from "next/image";

const palette = ["#FDE68A", "#BFDBFE", "#FBCFE8", "#BBF7D0", "#DDD6FE", "#FED7AA"];

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name = "?", size = 40, className = "" }: Props) {
  const style = { width: size, height: size };

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = palette[name.charCodeAt(0) % palette.length];

  return (
    <span
      style={{ ...style, background: color, fontSize: size * 0.38 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink/70 ${className}`}
    >
      {initials}
    </span>
  );
}
