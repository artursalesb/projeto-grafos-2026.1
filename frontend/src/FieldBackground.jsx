export default function FieldBackground() {
  return (
    <svg
      className="field-bg"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="grass"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <rect width="80" height="80" fill="#2a7a2a" />
          <rect width="40" height="80" fill="#338a33" />
        </pattern>
      </defs>

      <rect width="1600" height="900" fill="url(#grass)" />

      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        opacity="0.85"
      >
        <rect x="60" y="60" width="1480" height="780" />
        <line x1="800" y1="60" x2="800" y2="840" />
        <circle cx="800" cy="450" r="100" />
        <circle cx="800" cy="450" r="3" fill="#fff" />

        <rect x="60" y="225" width="180" height="450" />
        <rect x="60" y="325" width="70" height="250" />
        <path d="M 240 350 A 100 100 0 0 1 240 550" />

        <rect x="1360" y="225" width="180" height="450" />
        <rect x="1470" y="325" width="70" height="250" />
        <path d="M 1360 350 A 100 100 0 0 0 1360 550" />

        <path d="M 60 60 A 18 18 0 0 1 78 78" />
        <path d="M 1540 60 A 18 18 0 0 0 1522 78" />
        <path d="M 60 840 A 18 18 0 0 0 78 822" />
        <path d="M 1540 840 A 18 18 0 0 1 1522 822" />
      </g>
    </svg>
  );
}
