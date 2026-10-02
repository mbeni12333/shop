import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from './ui/button';
import Link from './Link';

const steps = [
  ['Vous choisissez', 'Votre matériel et votre commande.'],
  ['Nous préparons', 'Votre équipement est emballé pour le voyage.'],
  ['Colissimo International', 'Votre colis quitte la France vers l’Algérie.'],
  ['À vous de jouer', 'Vous recevez votre équipement en Algérie.'],
];

export default function ShippingJourney() {
  const scope = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const inView = useRef(false);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    pausedRef.current = paused;
    timeline.current?.paused(paused || !inView.current);
  }, [paused]);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const route = scope.current?.querySelector('[data-route]');
        const parcel = scope.current?.querySelector('[data-parcel]');
        const stops = scope.current?.querySelectorAll('[data-stop]');
        const animation = gsap.timeline({
          repeat: -1,
          repeatDelay: 1.5,
          paused: true,
        });
        timeline.current = animation;
        animation
          .fromTo(
            route ?? [],
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 7.2, ease: 'none' },
            0,
          )
          .fromTo(
            parcel ?? [],
            { x: 110, opacity: 1 },
            { x: 800, duration: 7.2, ease: 'none' },
            0,
          );
        stops?.forEach((stop, index) =>
          animation.fromTo(
            stop,
            { scale: 1 },
            {
              scale: 1.18,
              transformOrigin: '50% 50%',
              duration: 0.35,
              yoyo: true,
              repeat: 1,
              ease: 'back.out(2)',
            },
            index * 2.4,
          ),
        );
        animation.to(parcel ?? [], { opacity: 0, duration: 0.3 });
        const observer = new IntersectionObserver(
          ([entry]) => {
            inView.current = entry.isIntersecting;
            animation.paused(!entry.isIntersecting || pausedRef.current);
          },
          { threshold: 0.15 },
        );
        if (scope.current) observer.observe(scope.current);
        return () => {
          observer.disconnect();
          timeline.current = null;
        };
      });
      return () => media.revert();
    },
    { scope },
  );

  return (
    <section
      className="shipping-journey"
      ref={scope}
      aria-labelledby="journey-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">DE VOTRE CLIC À VOTRE PORTE</span>
          <h2 id="journey-title">Votre matériel fait le voyage.</h2>
        </div>
        <span className="delivery-estimate">
          <strong>4 jours ouvrés estimés</strong>
          <span>après remise à Colissimo International</span>
        </span>
      </div>
      <svg
        className="journey-diagram"
        viewBox="0 0 920 210"
        role="img"
        aria-label="Commande, préparation en France, expédition Colissimo International, réception en Algérie"
      >
        <path
          d="M110 142H800"
          stroke="#ddd7e6"
          strokeWidth="4"
          strokeDasharray="5 9"
          fill="none"
        />
        <path
          data-route
          d="M110 142H800"
          pathLength="1"
          stroke="#6840c6"
          strokeWidth="4"
          strokeDasharray="1"
          fill="none"
        />
        <g data-stop transform="translate(110 80)">
          <circle r="54" fill="#e8dff9" />
          <rect
            x="-30"
            y="-26"
            width="60"
            height="42"
            rx="5"
            fill="#fff"
            stroke="#6840c6"
            strokeWidth="3"
          />
          <path
            d="M-16 28H16M0 17V28M-16 -8L-5 2 16-16"
            stroke="#6840c6"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        <g data-stop transform="translate(340 80)">
          <circle r="54" fill="#e8dff9" />
          <path
            d="M-30-14L0-29 30-14V21L0 36-30 21Z"
            fill="#a58bcf"
            stroke="#6840c6"
            strokeWidth="3"
          />
          <path
            d="M-30-14L0 1 30-14M0 1V36M-15-22L15-7V6"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
        <g data-stop transform="translate(570 80)">
          <circle r="54" fill="#e8dff9" />
          <path
            d="M-36 3L-7-6 2-32 14-32 9-6 33-1Q42 3 33 7L8 11 13 34 2 34-8 12-31 17-39 9Z"
            fill="#6840c6"
          />
          <path
            d="M-39-18H-23M-45 28H-29"
            stroke="#a58bcf"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <g data-stop transform="translate(800 80)">
          <circle r="54" fill="#e8dff9" />
          <path
            d="M-34-3L0-31 34-3M-25-9V30H25V-9"
            stroke="#6840c6"
            fill="#fff"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <rect x="-8" y="7" width="16" height="23" rx="2" fill="#6840c6" />
          <circle cx="31" cy="22" r="16" fill="#27634b" />
          <path
            d="M23 22L29 28 39 17"
            stroke="white"
            strokeWidth="3"
            fill="none"
          />
        </g>
        <g data-parcel transform="translate(110 142)">
          <circle r="10" fill="#6840c6" stroke="white" strokeWidth="4" />
        </g>
        <g
          fill="#686274"
          fontSize="13"
          fontFamily="inherit"
          textAnchor="middle"
        >
          <text x="340" y="188">
            FRANCE
          </text>
          <text x="800" y="188">
            ALGÉRIE
          </text>
        </g>
      </svg>
      <ol className="journey-steps">
        {steps.map(([title, body], index) => (
          <li key={title}>
            <span className="journey-number">0{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="journey-footer">
        <Link className="text-link" href="/livraison">
          Comprendre la livraison ↗
        </Link>
        <Button
          className="motion-toggle"
          variant="ghost"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? 'Reprendre l’animation' : 'Mettre l’animation en pause'}
        </Button>
      </div>
    </section>
  );
}
