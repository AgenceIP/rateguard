import { DetailPaiement } from "./detail";

/**
 * Le segment est un simple passe-plat : tout le contenu dépend du profil, qui
 * vit dans le navigateur (localStorage ou Supabase avec la clé anon), donc le
 * travail se fait côté client.
 */
export default async function Page({ params }: PageProps<"/paiement/[id]">) {
  const { id } = await params;
  return <DetailPaiement id={id} />;
}
