import NextLink from 'next/link';
import { forwardRef, type ComponentProps } from 'react';

// Pages Router still prefetches on hover. Avoid loading every navigation/footer
// destination merely because it enters the viewport on a slower connection.
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(
  (props, ref) => (
    <NextLink ref={ref} {...props} prefetch={props.prefetch ?? false} />
  ),
);
Link.displayName = 'Link';
export default Link;
