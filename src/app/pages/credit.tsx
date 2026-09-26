/**
 * The credit dashboard — ခရက်ဒစ်.
 *
 * One page, three audiences, one component. A shop account sees its own
 * account and nothing to choose. A sales rep chooses among their own shops; an
 * admin among all of them. The choice is remembered on this device (see
 * `use-role.ts`), and the voucher page's credit checkout bills the same shop,
 * so a rep picks a shop here once and then orders for it from the catalogue.
 *
 * Accounts without a role — buyers who signed in only to keep a Telegram
 * order history — are told plainly that there is no credit account behind
 * their login, rather than shown an empty dashboard.
 */
import { Link } from 'react-router-dom';
import { Loader2, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RequireAuth } from '@/app/components/auth/require-auth';
import { ShopPicker } from '@/app/components/credit/shop-picker';
import { UserCreditStatus } from '@/app/components/credit/user-credit-status';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useRole } from '@/app/hooks/use-role';

function CreditDashboard() {
  const { t } = useTranslation();
  const { role, ready, can, shopId, chooseShop } = useRole();

  if (!ready) {
    return (
      <div className="grid place-items-center py-24" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  if (!role || !can('credit:view')) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <WalletCards className="mx-auto h-9 w-9 text-muted-foreground" strokeWidth={1.4} aria-hidden="true" />
        <h1 className="mt-4 font-myanmar text-base font-semibold text-foreground">{t('account.noAccountTitle')}</h1>
        <p className="mt-1.5 font-myanmar text-sm leading-relaxed text-muted-foreground">{t('account.noAccountBody')}</p>
        <Button asChild className="mt-6 min-h-11">
          <Link to={ROUTES.catalog}>{t('pages.notFound.cta')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        <span className="font-myanmar">{t('account.title')}</span>
      </h1>

      {can('shops:choose') ? <ShopPicker role={role} value={shopId} onChange={chooseShop} /> : null}

      {shopId ? (
        <UserCreditStatus shopId={shopId} role={role} />
      ) : (
        <p className="rounded-3xl border border-dashed border-border p-8 text-center font-myanmar text-sm text-muted-foreground">
          {t('account.picker.prompt')}
        </p>
      )}
    </div>
  );
}

export function CreditPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.credit'));

  return (
    <RequireAuth>
      <CreditDashboard />
    </RequireAuth>
  );
}
