import { SetMetadata } from '@nestjs/common';

export const ROTA_PUBLICA = 'rotaPublica';

/**
 * Libera a rota do JwtAuthGuard, que é global. Só /health e as rotas de
 * entrada da autenticação (login, registro, refresh) usam isto: toda rota nova
 * nasce protegida.
 */
export const Publica = () => SetMetadata(ROTA_PUBLICA, true);
