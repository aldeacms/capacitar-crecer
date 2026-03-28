import { getPaymentConfigs } from '@/actions/pagos-config'
import PagosForm from './PagosForm'

export default async function PagosAdminPage() {
  const configs = await getPaymentConfigs()
  return <PagosForm initialConfigs={configs} />
}
