import { useState } from 'react';
import Shell from '@/edoctor/Shell';
import Icon from '@/edoctor/Icon';
import { Button } from '@/edoctor/ui/button';
import { Badge } from '@/edoctor/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/edoctor/ui/card';
import { Input } from '@/edoctor/ui/input';
import { Label } from '@/edoctor/ui/label';
import { Checkbox } from '@/edoctor/ui/checkbox';
import { Slider } from '@/edoctor/ui/slider';
import { Skeleton } from '@/edoctor/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/edoctor/ui/accordion';

export default function DesignSystem() {
  const [range, setRange] = useState([100, 650]);
  return (
    <Shell title="Référence du design system" noindex categories={[]}>
      <div className="wrap page-section">
        <span className="eyebrow">EDoctor · référence interne</span>
        <h1>Une identité, chaque interaction.</h1>
        <p className="intro">
          Composants de référence, états et règles de composition.
        </p>
        <div className="design-system-grid">
          <Card>
            <CardHeader>
              <CardTitle>Palette et rythme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[
                  'bg-primary',
                  'bg-muted',
                  'bg-accent',
                  'bg-foreground',
                  'bg-card',
                ].map((color) => (
                  <span
                    key={color}
                    className={`${color} h-12 w-12 rounded-lg border border-border`}
                    aria-label={color}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Grille de 4 px · contrôles 48 px · cartes 16 px · sections 24
                px.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Actions et états</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>
                <Icon name="cart" />
                Ajouter au panier
              </Button>
              <Button variant="outline">
                Demander conseil
                <Icon name="arrow" />
              </Button>
              <Button variant="secondary">Explorer</Button>
              <Button variant="ghost">Réinitialiser</Button>
              <Button disabled>Indisponible</Button>
              <Button disabled aria-busy>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Vérification…
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Champs et retours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ds-search">Rechercher un produit</Label>
                <Input id="ds-search" placeholder="Nom, marque ou référence" />
              </div>
              <div>
                <Label htmlFor="ds-error">Adresse e-mail</Label>
                <Input
                  id="ds-error"
                  aria-invalid
                  aria-describedby="ds-error-message"
                  defaultValue="adresse incomplète"
                />
                <p
                  id="ds-error-message"
                  className="mt-2 text-sm text-destructive"
                >
                  Vérifiez le format de l’adresse.
                </p>
              </div>
              <Input disabled placeholder="Champ indisponible" />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Sélectionné</Badge>
                <Badge variant="outline">Sur demande</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Filtres et chargement</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={['brand', 'price']}>
                <AccordionItem value="brand">
                  <AccordionTrigger>Marque</AccordionTrigger>
                  <AccordionContent>
                    <div className="filter-choice">
                      <Checkbox id="ds-brand" defaultChecked />
                      <Label htmlFor="ds-brand">Marque sélectionnée</Label>
                      <span className="facet-count">12</span>
                    </div>
                    <div className="filter-choice">
                      <Checkbox id="ds-disabled" disabled />
                      <Label htmlFor="ds-disabled">Aucun résultat</Label>
                      <span className="facet-count">0</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="price">
                  <AccordionTrigger>Budget HT</AccordionTrigger>
                  <AccordionContent>
                    <Slider
                      min={0}
                      max={1000}
                      value={range}
                      onValueChange={setRange}
                      thumbLabels={['Budget minimum', 'Budget maximum']}
                    />
                    <p className="mt-4 text-sm">
                      {range[0]} € – {range[1]} €
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Skeleton className="mt-4 h-6 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Icônes de commande</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {(
                [
                  'search',
                  'cart',
                  'filters',
                  'menu',
                  'close',
                  'arrow',
                  'check',
                ] as const
              ).map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2 text-primary"
                >
                  <Icon name={name} />
                  <small>{name}</small>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mouvement</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Réponse 180 ms · panneaux 220 ms · apparition 450 ms · scène
                d’accueil 800 ms.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                La réduction des mouvements respecte les préférences du
                navigateur. Les contrôles restent utilisables pendant chaque
                transition.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
