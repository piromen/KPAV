import { FC } from "react";

export const Logo: FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
        fill="url(#gradient)"
        stroke="hsl(265 100% 60%)"
        strokeWidth="2"
      />
      <path
        d="M24 8L38 16V32L24 40L10 32V16L24 8Z"
        fill="rgba(147, 51, 234, 0.1)"
        stroke="hsl(265 100% 60%)"
        strokeWidth="1"
      />
      <path
        d="M24 14L32 18V30L24 34L16 30V18L24 14Z"
        fill="hsl(265 100% 60%)"
      />
      <defs>
        <linearGradient
          id="gradient"
          x1="24"
          y1="4"
          x2="24"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(265 100% 60%)" />
          <stop offset="1" stopColor="hsl(265 100% 40%)" />
        </linearGradient>
      </defs>
    </svg>
  );
};
