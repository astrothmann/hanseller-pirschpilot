/**
 * WildartIcon Component
 * Image-based icon component for displaying wildlife/game animal icons
 * Icons are loaded from /public/icons/wildarten/
 */

interface WildartIconProps {
  /** Icon name (maps to image file: icon.png) */
  icon: string;
  /** Icon size in pixels (width and height) */
  size: number;
  /** Optional CSS class name */
  className?: string;
}

export function WildartIcon({ icon, size, className = "" }: WildartIconProps) {
  // Map icon keys to file names - all PNG format
  const iconMap: Record<string, string> = {
    deer: "deer.png",
    boar: "boar.png",
    fox: "fox.png",
    badger: "badger.png",
    raccoon: "raccoon.png",
    fasan: "fasan.png",
    duck: "duck.png",
    hare: "hare.png",
    kaninchen: "kaninchen.png",
    schnepfe: "schnepfe.png",
  };

  const fileName = iconMap[icon] || "deer.png"; // Fallback to deer

  return (
    <img
      src={`/icons/wildarten/${fileName}`}
      width={size}
      height={size}
      alt={icon}
      className={`object-cover ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}
