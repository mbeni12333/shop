import Link from 'next/link';
import Shell from '@/edoctor/Shell';
const pages: Record<string, { title: string; sections: [string, string][] }> = {
  livraison: {
    title: 'De la France à l’Algérie',
    sections: [
      [
        'Un accompagnement de bout en bout',
        'EDoctor vous accompagne dans le choix de matériel neuf et l’organisation de son export vers l’Algérie. Notre objectif : une livraison soignée, avec des modalités claires avant votre règlement.',
      ],
      [
        'Votre expédition, confirmée ensemble',
        'La destination, le transport, les formalités et les frais inclus sont précisés dans votre proposition. Les délais dépendent du produit et de votre adresse : aucun délai n’est garanti avant confirmation.',
      ],
      [
        'Avant de commander',
        'Si aucun tarif d’expédition n’est disponible pour votre destination, un conseiller confirme votre proposition avant encaissement.',
      ],
    ],
  },
  paiement: {
    title: 'Un paiement adapté à votre commande',
    sections: [
      [
        'Carte bancaire et virement en euros',
        'Les moyens disponibles pour votre commande sont présentés sur le paiement sécurisé WooCommerce. Un virement est confirmé après réception effective des fonds.',
      ],
      [
        'BaridiMob / BaridiWeb avec un conseiller',
        'Choisissez le paiement accompagné. Un conseiller précise le montant, les coordonnées et les modalités applicables. Le site ne réalise aucune conversion automatique en dinars.',
      ],
      [
        'Votre commande reste en attente',
        'Une demande ou une preuve transmise ne vaut pas confirmation du règlement. La préparation dépend de la validation effective du paiement et des modalités d’export.',
      ],
    ],
  },
  garanties: {
    title: 'Garanties et retours',
    sections: [
      [
        'Un interlocuteur pour vous accompagner',
        'Contactez EDoctor avec votre référence de commande et une description du problème. Conservez votre facture, le numéro de série et les éléments utiles au diagnostic.',
      ],
      [
        'Des conditions à confirmer avant l’achat',
        'Les garanties applicables, modalités de retour depuis l’Algérie, frais et responsabilités doivent être précisés dans les conditions de vente définitives. Ces informations sont en cours de préparation ; elles ne réduisent pas les droits applicables.',
      ],
    ],
  },
  'mentions-legales': {
    title: 'Mentions légales',
    sections: [
      [
        'Informations en préparation',
        'Les coordonnées légales de l’éditeur, son immatriculation, ses coordonnées fiscales, le responsable de publication et l’hébergeur doivent être renseignés avant l’ouverture commerciale.',
      ],
    ],
  },
  confidentialite: {
    title: 'Vos informations personnelles',
    sections: [
      [
        'Votre demande de conseil',
        'Le formulaire collecte votre nom, votre e-mail et votre message afin que l’équipe réponde à votre demande. N’y transmettez pas de coordonnées bancaires ni de documents d’identité.',
      ],
      [
        'Panier et commande',
        'Le navigateur mémorise votre panier sur cet appareil. WooCommerce gère la session, les informations de commande et les échanges avec les prestataires de paiement configurés.',
      ],
      [
        'Informations à compléter avant ouverture',
        'L’identité du responsable, les durées de conservation, les prestataires, les modalités d’exercice des droits et les éventuels transferts doivent être précisés avant publication commerciale.',
      ],
    ],
  },
  conditions: {
    title: 'Conditions de vente',
    sections: [
      [
        'Ouverture commerciale en préparation',
        'Les conditions de vente définitives doivent préciser les prix, l’export, les moyens de paiement, la livraison, les garanties, les retours et le règlement des litiges. Aucun paiement réel ne doit être activé avant leur validation.',
      ],
    ],
  },
};
export default function Information({ slug }: { slug: string }) {
  const p = pages[slug];
  return (
    <Shell
      title={p.title}
      noindex={['mentions-legales', 'conditions', 'confidentialite'].includes(
        slug,
      )}
    >
      <div className="wrap page-section prose">
        <span className="eyebrow">EDOCTOR À VOS CÔTÉS</span>
        <h1>{p.title}</h1>
        {p.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
        <Link className="button" href="/contact">
          Parlons de votre besoin ↗
        </Link>
      </div>
    </Shell>
  );
}
export const getStaticPaths = () => ({
  paths: Object.keys(pages).map((information) => ({ params: { information } })),
  fallback: false,
});
export const getStaticProps = ({
  params,
}: {
  params: { information: string };
}) => ({ props: { slug: params.information } });
