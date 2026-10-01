import NextLink from 'next/link';
import type { ComponentProps } from 'react';

// Pages Router still prefetches on hover. Avoid loading every navigation/footer
// destination merely because it enters the viewport on a slower connection.
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} prefetch={props.prefetch ?? false} />;
}
