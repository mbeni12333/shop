import { useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

export const motion = { quick: 0.18, panel: 0.22, reveal: 0.45, hero: 0.8 };

/** All selectors and timelines belong to their component and revert on unmount. */
export function useDiscoveryMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', (context) => {
        const parts = scope.current?.querySelectorAll('[data-hero-part]');
        if (parts?.length) {
          const entrance = gsap.timeline();
          entrance
            .from(parts, {
              x: (index) => [-72, 96, -48, 64][index] ?? 0,
              y: (index) => [48, -48, 72, 52][index] ?? 0,
              scale: 0.82,
              rotation: (index) => (index % 2 ? 9 : -9),
              opacity: 0,
              duration: 0.66,
              stagger: 0.08,
              ease: 'back.out(1.3)',
            })
            .to(parts, {
              y: (index) => (index % 2 ? -9 : 7),
              rotation: (index) => (index % 2 ? 1.5 : -1),
              duration: 1.4,
              stagger: 0.16,
              yoyo: true,
              repeat: 1,
              ease: 'sine.inOut',
            })
            .set(parts, { clearProps: 'all' });
        }
        const observer = new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((entry) => entry.isIntersecting)
              .map((entry) => entry.target);
            if (!visible.length) return;
            // Content starts visible in SSR; nothing waits for JS to become readable.
            context.add(() =>
              gsap.from(visible, {
                y: 48,
                scale: 0.94,
                duration: 0.7,
                stagger: 0.08,
                ease: 'power2.out',
                clearProps: 'transform',
              }),
            );
            visible.forEach((target) => observer.unobserve(target));
          },
          { threshold: 0.12 },
        );
        scope.current
          ?.querySelectorAll('[data-discover]')
          .forEach((node) => observer.observe(node));
        return () => observer.disconnect();
      });
      media.add(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const nodes =
            scope.current?.querySelectorAll<HTMLElement>(
              '[data-interactive-art]',
            ) ?? [];
          const cleanup: (() => void)[] = [];
          scope.current
            ?.querySelectorAll<HTMLElement>('[data-hero-part]')
            .forEach((part, index) => {
              const enter = () => {
                if (gsap.isTweening(part)) return;
                gsap.to(part, {
                  y: -18,
                  scale: 1.1,
                  rotation: index % 2 ? 5 : -5,
                  duration: 0.35,
                  ease: 'back.out(2)',
                  overwrite: 'auto',
                });
              };
              const leave = () => {
                gsap.to(part, {
                  y: 0,
                  scale: 1,
                  rotation: 0,
                  duration: 0.45,
                  overwrite: 'auto',
                });
              };
              part.addEventListener('pointerenter', enter);
              part.addEventListener('pointerleave', leave);
              cleanup.push(() => {
                part.removeEventListener('pointerenter', enter);
                part.removeEventListener('pointerleave', leave);
              });
            });
          nodes.forEach((node) => {
            const art = node.querySelector('[data-art-layer]');
            if (!art) return;
            const x = gsap.quickTo(art, 'x', {
              duration: 0.35,
              ease: 'power2.out',
            });
            const y = gsap.quickTo(art, 'y', {
              duration: 0.35,
              ease: 'power2.out',
            });
            const move = (event: PointerEvent) => {
              const rect = node.getBoundingClientRect();
              x(((event.clientX - rect.left) / rect.width - 0.5) * 28);
              y(((event.clientY - rect.top) / rect.height - 0.5) * 22);
            };
            const reset = () => {
              x(0);
              y(0);
            };
            const focus = () => y(-12);
            node.addEventListener('pointermove', move);
            node.addEventListener('pointerleave', reset);
            node.addEventListener('focusin', focus);
            node.addEventListener('focusout', reset);
            cleanup.push(() => {
              node.removeEventListener('pointermove', move);
              node.removeEventListener('pointerleave', reset);
              node.removeEventListener('focusin', focus);
              node.removeEventListener('focusout', reset);
            });
          });
          return () => cleanup.forEach((dispose) => dispose());
        },
      );
      return () => media.revert();
    },
    { scope },
  );
}

export function useBasketMotion(count: number, ready: boolean) {
  const scope = useRef<HTMLAnchorElement>(null);
  const previous = useRef(count);
  useGSAP(
    () => {
      if (
        ready &&
        count > previous.current &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        gsap.fromTo(
          scope.current?.querySelector('.basket-count') ?? [],
          { scale: 1 },
          {
            scale: 1.2,
            duration: motion.quick,
            yoyo: true,
            repeat: 1,
            clearProps: 'transform',
            overwrite: true,
          },
        );
      }
      previous.current = count;
    },
    { scope, dependencies: [count, ready], revertOnUpdate: true },
  );
  return scope;
}

export function useResultsMotion(signature: string) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(
          scope.current,
          { opacity: 0.75 },
          {
            opacity: 1,
            duration: motion.quick,
            clearProps: 'opacity',
            overwrite: true,
          },
        );
      }
    },
    { scope, dependencies: [signature], revertOnUpdate: true },
  );
  return scope;
}
