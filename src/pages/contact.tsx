import { useRouter } from 'next/router';
import { useState } from 'react';
import Shell from '@/edoctor/Shell';
import Image from 'next/image';
export default function Contact() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Shell title="Parlons de votre projet">
      <div className="wrap page-section">
        <div className="contact-layout">
          <div>
            <span className="eyebrow">UN VRAI INTERLOCUTEUR</span>
            <h1>On vous écoute.</h1>
            <p className="intro">
              Un conseil, une configuration, une question sur l’export ?
              Décrivez votre projet : votre message sera transmis à l’équipe
              EDoctor.
            </p>
            <form
              className="contact-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setStatus('');
                const form = e.currentTarget;
                const data = Object.fromEntries(new FormData(form));
                try {
                  const r = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });
                  const result = await r.json();
                  if (!r.ok) throw new Error(result.error);
                  setStatus('Votre demande a bien été enregistrée. Merci !');
                  form.reset();
                } catch (error) {
                  setStatus(
                    error instanceof Error
                      ? error.message
                      : 'Envoi impossible. Réessayez.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Votre nom
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Votre adresse e-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                />
              </label>
              <label>
                Votre projet
                <textarea
                  name="message"
                  required
                  maxLength={4000}
                  minLength={10}
                  defaultValue={
                    typeof router.query.produit === 'string'
                      ? `Je souhaite un conseil concernant : ${router.query.produit}`
                      : ''
                  }
                  key={String(router.query.produit || '')}
                />
              </label>
              <label className="honeypot" aria-hidden>
                Site internet
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <label>
                <input type="checkbox" name="consent" value="yes" required />
                J’accepte l’utilisation de ces informations pour répondre à ma
                demande.
              </label>
              <button className="button" disabled={busy}>
                {busy ? 'Envoi en cours…' : 'Envoyer ma demande ↗'}
              </button>
              <p role="status">{status}</p>
            </form>
            {process.env.NEXT_PUBLIC_WHATSAPP && (
              <p>
                <a
                  className="text-link"
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP.replace(/\D/g, '')}`}
                >
                  Échanger sur WhatsApp ↗
                </a>
              </p>
            )}
            {process.env.NEXT_PUBLIC_PHONE && (
              <p>
                <a href={`tel:${process.env.NEXT_PUBLIC_PHONE}`}>
                  {process.env.NEXT_PUBLIC_PHONE}
                </a>
              </p>
            )}
          </div>
          <aside className="contact-welcome">
            <Image
              src="/brand/ed-welcome.png"
              alt="ED vous accueille avec un sourire et un pouce levé"
              width={1024}
              height={1536}
              sizes="(max-width:767px) 280px, 320px"
            />
            <p>Votre projet mérite qu’on prenne le temps d’en parler.</p>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
