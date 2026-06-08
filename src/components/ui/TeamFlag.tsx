type TeamFlagProps = {
  name: string;
  code: string;
  flag_emoji?: string | null;
  flag_code?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const FLAG_SIZE_MAP = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-6xl",
};

function getFlagEmoji(flag_code: string | null | undefined): string {
  if (!flag_code) return "🏴";

  if (flag_code === "GB-ENG") {
    return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  }
  
  if (flag_code === "GB-SCT") {
    return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  }

  if (flag_code.length === 2) {
    const codePoints = flag_code
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  return "🏴";
}

function isValidEmoji(emoji: string | null | undefined): boolean {
  if (!emoji) return false;
  if (emoji === "🏴") return true;
  if (emoji.includes("�")) return false;
  if (emoji.length === 0) return false;
  return true;
}

export default function TeamFlag({
  name,
  code,
  flag_emoji,
  flag_code,
  size = "md",
  className = "",
}: TeamFlagProps) {
  let displayFlag = "🏴";

  if (isValidEmoji(flag_emoji)) {
    displayFlag = flag_emoji!;
  } else if (flag_code) {
    displayFlag = getFlagEmoji(flag_code);
  }

  return (
    <span
      className={`${FLAG_SIZE_MAP[size]} ${className}`}
      title={`${name} (${code})`}
      aria-label={`${name} flag`}
    >
      {displayFlag}
    </span>
  );
}
