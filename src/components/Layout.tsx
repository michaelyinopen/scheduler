import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { NavigationMenu } from '@base-ui/react'
import schedulerLogo from '/logo.svg'
import { ArrowSvg } from './ArrowSvg'
import { ChevronDownIcon } from './ChevronDownIcon'
import styles from './Layout.module.css'

function Link(props: NavigationMenu.Link.Props) {
  return (
    <NavigationMenu.Link
      render={
        // Use the `render` prop to render your framework's Link component
        // for client-side routing.
        // e.g. `<NextLink href={props.href} />` instead of `<a />`.
        <NavLink to={props.href ?? ''} />
      }
      {...props}
    />
  );
}

export type LayoutProps = {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div>
      <NavigationMenu.Root className={styles.Root}>
        <NavigationMenu.List className={styles.List}>
          <NavigationMenu.Item>
            <div className={styles.Product}>
              <img src={schedulerLogo} className={styles.ProductLogo} alt="Scheduler logo" />
              <h4 className={styles.ProductName}>
                Scheduler
              </h4>
              <div className={styles.ProductSeparator} />
            </div>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={styles.Trigger}>
              Examples
              <NavigationMenu.Icon className={styles.Icon}>
                <ChevronDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={styles.Content}>
              <ul className={styles.FlexLinkList}>
                <li>
                  <Link className={styles.LinkCard} href="/1">
                    <h3 className={styles.LinkTitle}>Example 1: Schedule</h3>
                  </Link>
                </li>
                <li>
                  <Link className={styles.LinkCard} href="/2">
                    <h3 className={styles.LinkTitle}>Example 2: Optimise</h3>
                  </Link>
                </li>
                <li>
                  <Link className={styles.LinkCard} href="/3">
                    <h3 className={styles.LinkTitle}>Example 3: Expand</h3>
                  </Link>
                </li>
                <li>
                  <Link className={styles.LinkCard} href="/4">
                    <h3 className={styles.LinkTitle}>Example 4: Collaborate</h3>
                  </Link>
                </li>
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item className={styles.LastElement}>
            <NavigationMenu.Link
              className={styles.Trigger}
              href='https://github.com/michaelyinopen/scheduler'
              target="_blank"
            >
              GitHub
            </NavigationMenu.Link>
          </NavigationMenu.Item>

        </NavigationMenu.List>
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner
            className={styles.Positioner}
            sideOffset={10}
            collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
            collisionAvoidance={{ side: 'none' }}
          >
            <NavigationMenu.Popup className={styles.Popup}>
              <NavigationMenu.Arrow className={styles.Arrow}>
                <ArrowSvg />
              </NavigationMenu.Arrow>
              <NavigationMenu.Viewport className={styles.Viewport} />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>
      <div className={styles.Page}>
        {children}
      </div>
    </div>
  )
}
