import { useRouter } from 'next/router';
import { useState } from 'react';
import Shell from '@/edoctor/Shell';
import Image from 'next/image';
import { Button } from '@/edoctor/ui/button';
import { Checkbox } from '@/edoctor/ui/checkbox';
import { Input } from '@/edoctor/ui/input';
import { Label } from '@/edoctor/ui/label';
import { Textarea } from '@/edoctor/ui/textarea';
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
              <div className="filter-field">
                <Label htmlFor="contact-name">Votre nom</Label>
                <Input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </div>
              <div className="filter-field">
                <Label htmlFor="contact-email">Votre adresse e-mail</Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                />
              </div>
              <div className="filter-field">
                <Label htmlFor="contact-message">Votre projet</Label>
                <Textarea
                  id="contact-message"
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
              </div>
              <label className="honeypot" aria-hidden>
                Site internet
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <div className="filter-choice">
                <Checkbox
                  id="contact-consent"
                  name="consent"
                  value="yes"
                  required
                />
                <Label htmlFor="contact-consent" className="font-normal">
                  J’accepte l’utilisation de ces informations pour répondre à ma
                  demande.
                </Label>
              </div>
              <Button disabled={busy}>
                {busy ? 'Envoi en cours…' : 'Envoyer ma demande ↗'}
              </Button>
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
