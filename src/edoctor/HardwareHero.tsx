import Image from 'next/image';

// Real SVG assets stay editable; separate layers let GSAP assemble the scene.
export default function HardwareHero() {
  const layers = {
    ecrans: 'hardware-part hardware-ecrans',
    'pc-fixes': 'hardware-part hardware-pc-fixes',
    claviers: 'hardware-part hardware-claviers',
    souris: 'hardware-part hardware-souris',
  };
  return (
    <div
      className="hardware-scene"
      data-art-layer
      role="img"
      aria-label="Illustration d’un ordinateur, d’un écran, d’un clavier et d’une souris"
    >
      <div className="hardware-ground" />
      {(['ecrans', 'pc-fixes', 'claviers', 'souris'] as const).map((part) => (
        <div key={part} className={layers[part]} data-hero-part>
          <Image
            src={`/univers/vector/${part}.svg`}
            alt=""
            fill
            sizes="(max-width: 767px) 55vw, 420px"
            priority
          />
        </div>
      ))}
    </div>
  );
}
