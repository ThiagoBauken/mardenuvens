import { useFavorites } from '../lib/favorites';

interface Props {
  id: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function FavoriteStar({ id, size = 'sm', className = '' }: Props): JSX.Element {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(id);
  const sz = size === 'md' ? 'w-6 h-6 text-xl' : 'w-5 h-5 text-base';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(id);
      }}
      className={`inline-flex items-center justify-center ${sz} ${
        fav ? 'text-amber-300 hover:text-amber-200' : 'text-cloud-dim/40 hover:text-cloud-dim'
      } transition-colors ${className}`}
      title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={fav}
    >
      {fav ? '★' : '☆'}
    </button>
  );
}
