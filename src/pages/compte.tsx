import Shell from '@/edoctor/Shell';
export default function Account({ url }: { url: string }) {
  return (
    <Shell title="Mon compte" noindex>
      <div className="wrap page-section narrow">
        <h1>Votre espace client.</h1>
        <p>
          Vos commandes et vos informations sont gérées dans votre espace
          WooCommerce sécurisé.
        </p>
        {url ? (
          <a className="button" href={url}>
            Accéder à mon compte ↗
          </a>
        ) : (
          <p className="notice">
            L’espace client sera disponible à l’ouverture de la boutique.
          </p>
        )}
      </div>
    </Shell>
  );
}
export const getServerSideProps = ({
  res,
}: {
  res: { setHeader: (k: string, v: string) => void };
}) => {
  res.setHeader('Cache-Control', 'private, no-store');
  return { props: { url: process.env.WOOCOMMERCE_ACCOUNT_URL || '' } };
};
